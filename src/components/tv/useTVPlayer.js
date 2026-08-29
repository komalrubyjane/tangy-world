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

export const TV_STATE = {
  BOOTING:   'BOOTING',    // playing first.mp4
  PLAYING:   'PLAYING',    // playing shuffled playlist video
  SWITCHING: 'SWITCHING',  // playing middle.mp4 before channel change
  OFF:       'OFF',        // powered off, black screen
};

export function useTVPlayer() {
  const videoRef = useRef(null);

  // ── Playlist ──────────────────────────────────────────────────────────────
  const [shuffled,      setShuffled]      = useState([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [pendingIndex,  setPendingIndex]  = useState(null);

  // ── Machine state ─────────────────────────────────────────────────────────
  const [tvState,    setTvState]    = useState(TV_STATE.OFF);
  const [isPowered,  setIsPowered]  = useState(false);
  const [isPlaying,  setIsPlaying]  = useState(false);
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

  const currentSrc      = currentVideo?.url || '';
  const channelNumber   = currentIndex + 1;
  const totalVideos     = shuffled.length;

  // ── Load and play whenever the source changes ──────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isPowered) return;
    if (tvState === TV_STATE.OFF) { video.pause(); return; }
    if (!currentSrc) return;

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
    video.addEventListener('ended',          onEnded);

    return () => {
      video.removeEventListener('timeupdate',     onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play',           onPlay);
      video.removeEventListener('pause',          onPause);
      video.removeEventListener('ended',          onEnded);
    };
  }, [tvState, pendingIndex, shuffled]);

  // ── Helper: interrupt whatever is playing and queue a channel switch ───────
  const triggerSwitch = useCallback((nextIdx) => {
    const safeIdx = ((nextIdx % shuffled.length) + shuffled.length) % (shuffled.length || 1);
    setPendingIndex(safeIdx);
    setKnobAngle(prev => prev + 36);

    // Immediately stop current video and load middle.mp4
    const video = videoRef.current;
    if (video && MIDDLE_VIDEO?.url) {
      video.pause();
      video.src = MIDDLE_VIDEO.url;
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
    tvState, isPowered,
    currentVideo, currentIndex, channelNumber, totalVideos,
    isPlaying, isMuted, volume, currentTime, duration, knobAngle,
    play, pause, seek, changeVolume, toggleMute,
    nextChannel, prevChannel, togglePower, requestFullscreen,
  };
}
