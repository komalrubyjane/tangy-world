import { useState, useRef, useEffect, useCallback } from 'react';
import { FIRST_VIDEO, MIDDLE_VIDEO, shufflePlaylist } from './playlist.js';
import { tvChannelService } from '../../services/tvChannelService';

// The boot (first.mp4) and channel-switch (middle.mp4) videos stay fixed,
// discovered via playlist.js's glob — but the actual channel lineup is
// admin-managed (Admin → Tangy TV) so add/edit/delete there has a real,
// visible effect on what plays. TVControls reads `currentVideo.filename`
// for its "NOW PLAYING" label, so channels are mapped into that shape here
// rather than touching every consumer.
function getChannelPlaylist() {
  return tvChannelService.getPlaylist().map((c) => ({ filename: c.title, url: c.url }));
}

// Admin-entered channel URLs (tvChannels.js) are raw local paths, unlike
// FIRST_VIDEO/MIDDLE_VIDEO which come pre-encoded from Vite's import.meta.glob.
// A raw path with spaces/commas/@ etc. plays fine from Vite's dev server but
// can fail to resolve against the static host in production, silently
// falling through to the SPA rewrite — so encode local paths before use.
// Shared by both the reactive src-derivation below and triggerSwitch's
// imperative write, so the two always agree on the exact same string.
function toPlayableSrc(url) {
  const raw = url || '';
  return raw.startsWith('/') ? encodeURI(raw) : raw;
}

export const TV_STATE = {
  BOOTING:   'BOOTING',    // playing first.mp4
  PLAYING:   'PLAYING',    // playing shuffled playlist video
  SWITCHING: 'SWITCHING',  // playing middle.mp4 before channel change
  OFF:       'OFF',        // powered off, black screen
};

export function useTVPlayer() {
  const videoRef = useRef(null);
  // The exact src string last actually applied to the <video> element (via
  // either the reactive effect below or triggerSwitch's imperative write) —
  // lets both paths agree on "has this source already been loaded" instead
  // of racing each other. See the "Load and play" effect for why this matters.
  const lastAppliedSrcRef = useRef('');

  // ── Playlist ──────────────────────────────────────────────────────────────
  const [shuffled,      setShuffled]      = useState([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [pendingIndex,  setPendingIndex]  = useState(null);

  // ── Machine state ─────────────────────────────────────────────────────────
  const [tvState,    setTvState]    = useState(TV_STATE.OFF);
  const [isPowered,  setIsPowered]  = useState(false);
  const [isPlaying,  setIsPlaying]  = useState(false);
  // The src that most recently fired 'loadeddata' (an actual paintable
  // frame decoded) — see `isVideoReady` below, derived from this every
  // render, for why this is a src comparison rather than a plain boolean.
  const [readySrc,   setReadySrc]   = useState('');
  const [isMuted,    setIsMuted]    = useState(true);
  const [volume,     setVolume]     = useState(0.8);
  const [currentTime,setCurrentTime]= useState(0);
  const [duration,   setDuration]   = useState(0);
  const [knobAngle,  setKnobAngle]  = useState(0);

  // ── Initialise once on mount ───────────────────────────────────────────────
  useEffect(() => {
    const fresh = shufflePlaylist(getChannelPlaylist());
    setShuffled(fresh);
    setCurrentIndex(0);
    setIsPowered(true);
    setTvState(TV_STATE.BOOTING); // always boot from first.mp4 on every load
  }, []);

  // ── Source derivation ──────────────────────────────────────────────────────
  const currentVideo = (() => {
    if (tvState === TV_STATE.BOOTING)   return FIRST_VIDEO;
    if (tvState === TV_STATE.SWITCHING) return MIDDLE_VIDEO;
    if (tvState === TV_STATE.PLAYING)   return shuffled[currentIndex] || null;
    return null;
  })();

  const currentSrc       = toPlayableSrc(currentVideo?.url);
  const channelNumber   = currentIndex + 1;
  const totalVideos     = shuffled.length;

  // Derived, not a separately-toggled boolean: true only when the src we
  // actually WANT playing right now (`currentSrc`) is the one that has
  // already decoded a frame (`readySrc`). Deriving it this way means it
  // automatically becomes false the instant `currentSrc` changes — for
  // ANY reason (channel switch, auto-advance, admin playlist edit) — on
  // the exact same render, with no call site needing to remember to reset
  // a flag. A plain `useState(false)` reset from inside an effect was
  // tried first and had a real gap: the effect resetting it always runs
  // one render AFTER the state change that flips tvState/currentIndex, so
  // there was one paintable frame where the covering UI had already
  // dropped (because it read the OLD, stale "ready" value) before the new
  // source's un-readiness caught up — i.e. exactly the flash this exists
  // to prevent.
  const isVideoReady = !!currentSrc && readySrc === currentSrc;

  // ── Load and play whenever the source changes ──────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPowered) return;
    if (tvState === TV_STATE.OFF) { video.pause(); return; }
    if (!currentSrc) return;

    // triggerSwitch() (below) applies the middle.mp4 src imperatively and
    // synchronously, the instant the user changes channel, so the transition
    // clip starts with no extra render round-trip. This effect then also
    // runs afterwards, because `tvState` changing to SWITCHING is itself one
    // of its dependencies — even though `currentSrc` didn't change. Without
    // this guard it would call `.load()` a second time on the video that
    // triggerSwitch had JUST started loading, which aborts the in-flight
    // fetch/decode and restarts it — that abort-and-restart is what showed
    // up as a static/blank flash before playback recovered.
    if (lastAppliedSrcRef.current === currentSrc) return;
    lastAppliedSrcRef.current = currentSrc;

    video.src         = currentSrc;
    video.muted       = isMuted;
    video.volume      = volume;
    video.preload     = 'metadata';
    video.playsInline = true;
    video.load();
    video.play().catch(() => {});
    setIsPlaying(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSrc, tvState, isPowered]);

  // ── Sync volume / mute to DOM element ─────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted  = isMuted;
    video.volume = volume;
  }, [isMuted, volume]);

  // ── Video DOM event listeners ──────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate     = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(isFinite(video.duration) ? video.duration : 0);
    const onPlay           = () => setIsPlaying(true);
    const onPause          = () => setIsPlaying(false);
    // Fires once the CURRENT src has decoded an actual paintable frame.
    // Records which src that was (lastAppliedSrcRef, set right before this
    // src was assigned) rather than just `true` — see `isVideoReady`'s own
    // derivation above for why that comparison is what actually closes the
    // gap, not a plain boolean.
    const onLoadedData      = () => setReadySrc(lastAppliedSrcRef.current);

    const onEnded = () => {
      // BOOTING: first.mp4 loops continuously until user changes channel
      if (tvState === TV_STATE.BOOTING) {
        const v = videoRef.current;
        if (v && FIRST_VIDEO?.url) { v.currentTime = 0; v.play().catch(() => {}); }
        return;
      }
      if (tvState === TV_STATE.SWITCHING) {
        const next = pendingIndex !== null ? pendingIndex : 0;
        setPendingIndex(null);
        setCurrentIndex(next);
        setTvState(TV_STATE.PLAYING);
        return;
      }
      if (tvState === TV_STATE.PLAYING) {
        // Auto-advance — wraps around
        setCurrentIndex(prev => (prev + 1) % (shuffled.length || 1));
      }
    };

    video.addEventListener('timeupdate',     onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play',           onPlay);
    video.addEventListener('pause',          onPause);
    video.addEventListener('loadeddata',     onLoadedData);
    video.addEventListener('ended',          onEnded);

    return () => {
      video.removeEventListener('timeupdate',     onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play',           onPlay);
      video.removeEventListener('pause',          onPause);
      video.removeEventListener('loadeddata',     onLoadedData);
      video.removeEventListener('ended',          onEnded);
    };
  }, [tvState, pendingIndex, shuffled]);

  // ── Helper: interrupt whatever is playing and queue a channel switch ───────
  const triggerSwitch = useCallback((nextIdx) => {
    const safeIdx = ((nextIdx % shuffled.length) + shuffled.length) % (shuffled.length || 1);
    setPendingIndex(safeIdx);
    setKnobAngle(prev => prev + 36);

    // Immediately stop current video and load middle.mp4 — pause() first so
    // the outgoing channel's audio/decode stops before we touch .src at all
    // (setting .src while still playing is what can expose a stray frame of
    // the previous video during the swap).
    const video = videoRef.current;
    if (video && MIDDLE_VIDEO?.url) {
      const middleSrc = toPlayableSrc(MIDDLE_VIDEO.url);
      video.pause();
      video.src = middleSrc;
      // Record this as already-applied so the "Load and play" effect (which
      // still fires right after, since it also depends on `tvState`) sees a
      // match and skips re-loading a source that's already mid-fetch —
      // see that effect's own comment for why a second .load() here glitches.
      lastAppliedSrcRef.current = middleSrc;
      video.load();
      video.play().catch(() => {});
    }
    // Update state AFTER imperatively starting the video so the useEffect
    // doesn't double-load it (currentSrc won't change until SWITCHING state updates)
    setTvState(TV_STATE.SWITCHING);
    setIsPlaying(true);
  }, [shuffled.length]);

  // ── Public controls ────────────────────────────────────────────────────────
  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const seek = useCallback((time) => {
    if (videoRef.current) videoRef.current.currentTime = time;
  }, []);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // ── Next / Previous — interruptible from ANY state ─────────────────────────
  const nextChannel = useCallback(() => {
    if (!isPowered) return;
    // If booting, interrupt and switch from index 0
    if (tvState === TV_STATE.BOOTING || tvState === TV_STATE.PLAYING) {
      const next = tvState === TV_STATE.BOOTING ? 0 : (currentIndex + 1) % (shuffled.length || 1);
      triggerSwitch(next);
      return;
    }
    // If already switching, ignore (middle.mp4 must finish)
  }, [isPowered, tvState, currentIndex, shuffled.length, triggerSwitch]);

  const prevChannel = useCallback(() => {
    if (!isPowered) return;
    if (tvState === TV_STATE.BOOTING || tvState === TV_STATE.PLAYING) {
      const prev = tvState === TV_STATE.BOOTING
        ? shuffled.length - 1
        : (currentIndex - 1 + shuffled.length) % (shuffled.length || 1);
      triggerSwitch(prev);
      return;
    }
  }, [isPowered, tvState, currentIndex, shuffled.length, triggerSwitch]);

  const togglePower = useCallback(() => {
    if (isPowered) {
      videoRef.current?.pause();
      setIsPlaying(false);
      setIsPowered(false);
      setTvState(TV_STATE.OFF);
    } else {
      const fresh = shufflePlaylist(getChannelPlaylist());
      setShuffled(fresh);
      setCurrentIndex(0);
      setPendingIndex(null);
      setIsPowered(true);
      setTvState(TV_STATE.BOOTING);
    }
  }, [isPowered]);

  const requestFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    (v.requestFullscreen || v.webkitRequestFullscreen)?.call(v);
  }, []);

  return {
    videoRef,
    tvState, isPowered, isVideoReady,
    currentVideo, currentIndex, channelNumber, totalVideos,
    isPlaying, isMuted, volume, currentTime, duration, knobAngle,
    play, pause, seek, changeVolume, toggleMute,
    nextChannel, prevChannel, togglePower, requestFullscreen,
  };
}
