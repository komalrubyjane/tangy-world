import { useState, useRef, useEffect, useCallback } from 'react';
import { FIRST_VIDEO, MIDDLE_VIDEO, shufflePlaylist } from './playlist.js';
import { tvChannelService } from '../../services/tvChannelService';

// The boot (first.mp4) and channel-switch (middle.mp4) videos stay fixed,
// discovered via playlist.js's glob — but the actual channel lineup is
// admin-managed (Admin → Tangy TV). TVControls reads
// `currentVideo.filename` for its "NOW PLAYING" label, so channels are
// mapped into that shape here.
function getChannelPlaylist() {
  return tvChannelService.getPlaylist().map((c) => ({ filename: c.title, url: c.url }));
}

// Admin-entered channel URLs are raw local paths (may contain spaces etc.),
// unlike FIRST_VIDEO/MIDDLE_VIDEO which come pre-encoded from Vite's glob.
function toPlayableSrc(url) {
  const raw = url || '';
  return raw.startsWith('/') ? encodeURI(raw) : raw;
}

const FIRST_SRC = toPlayableSrc(FIRST_VIDEO?.url);
const TUNING_SRC = toPlayableSrc(MIDDLE_VIDEO?.url);

export const TV_STATE = {
  OFF:       'OFF',        // powered off
  BOOTING:   'BOOTING',    // first.mp4, looping until the first channel change
  SWITCHING: 'SWITCHING',  // tuning layer visible; next channel loading underneath
  PLAYING:   'PLAYING',    // a channel is on screen (paused/playing tracked by isPlaying)
};

/*
 * TV PLAYBACK — single owner.
 *
 * This hook is the ONLY code that touches either <video> element's src,
 * load(), play() or pause(). TVScreen only renders the two elements and
 * forwards refs; no React effect derives a src from state.
 *
 * Two elements:
 *   videoRef  — the channel picture (first.mp4, then channels).
 *   tuneRef   — middle.mp4, loaded ONCE on mount and kept decoded, shown as
 *               a layer above the channel picture while tuning.
 *
 * Channel change (from any non-OFF state, including mid-switch):
 *   1. tuning layer becomes visible and (if not already running) plays
 *      from 0 — it's already decoded, so it paints on the very next frame;
 *   2. the channel element is paused and given the new src + load(),
 *      hidden underneath the tuning layer;
 *   3. we wait for BOTH the tuning clip to finish AND the new channel to
 *      reach `canplay` (whichever is later; the tuning clip loops if the
 *      network is slow);
 *   4. then state → PLAYING and play() the channel; the tuning layer is
 *      removed only on the channel's `playing` event, i.e. once a real frame
 *      of the new source is on screen.
 *
 * Every switch bumps `token`; late events from an abandoned source are
 * ignored by comparing the element's current src with the one we assigned,
 * so rapid clicking can never apply a stale source or double-play.
 *
 * Why the old version glitched (A → blank → static → blank → B):
 *   - both channel and tuning clip shared ONE <video>: assigning middle.mp4
 *     cleared the old frame and showed black until middle decoded (blank #1);
 *   - when middle ended, the same element was re-pointed at B and hidden
 *     until B decoded (blank #2) — and that hide never fully worked because
 *     a CSS `tvFlicker` opacity animation on the <video> overrode its inline
 *     opacity, so the empty element showed through;
 *   - src was written from two places (an effect keyed on tvState/currentSrc
 *     AND triggerSwitch), guarded by a ref to avoid double load().
 */
export function useTVPlayer() {
  const videoRef = useRef(null);
  const tuneRef = useRef(null);

  // Imperative mirrors of state, read inside media-event handlers.
  const stateRef = useRef(TV_STATE.OFF);
  const shuffledRef = useRef([]);
  const indexRef = useRef(0);
  const switchRef = useRef({ token: 0, target: 0, expectedSrc: '', tuneDone: true, channelReady: false, revealPending: false });

  const [tvState, setTvStateRaw] = useState(TV_STATE.OFF);
  const [isTuningVisible, setIsTuningVisible] = useState(false);
  const [shuffled, setShuffled] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [targetIndex, setTargetIndex] = useState(0);
  const [isPowered, setIsPowered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [knobAngle, setKnobAngle] = useState(0);

  const setTvState = useCallback((s) => {
    stateRef.current = s;
    setTvStateRaw(s);
  }, []);

  // Assign a src to the channel element exactly once per source change.
  const loadChannel = useCallback((src) => {
    const v = videoRef.current;
    if (!v) return '';
    v.pause();
    v.src = src;
    v.load();
    setCurrentTime(0);
    setDuration(0);
    // Read back the normalised absolute URL the element will report in its
    // own events, so late events from a previous src can be told apart.
    return v.src;
  }, []);

  const revealChannel = useCallback(() => {
    const sw = switchRef.current;
    sw.revealPending = false;
    setIsTuningVisible(false);
    const t = tuneRef.current;
    if (t) {
      t.pause();
      // Rewind now, while hidden, so the next switch starts on an
      // already-decoded first frame instead of seeking on screen.
      t.currentTime = 0;
    }
  }, []);

  const finishSwitchIfReady = useCallback(() => {
    const sw = switchRef.current;
    if (stateRef.current !== TV_STATE.SWITCHING || !sw.tuneDone || !sw.channelReady) return false;
    const v = videoRef.current;
    indexRef.current = sw.target;
    setCurrentIndex(sw.target);
    setTvState(TV_STATE.PLAYING);
    sw.revealPending = true;
    const token = sw.token;
    v?.play().catch(() => {
      // Autoplay refused (e.g. unmuted without a gesture): show the paused
      // first frame rather than leaving the tuning layer up forever.
      if (switchRef.current.token === token) revealChannel();
    });
    return true;
  }, [revealChannel, setTvState]);

  const boot = useCallback(() => {
    const v = videoRef.current;
    const sw = switchRef.current;
    sw.token += 1;
    sw.revealPending = false;
    setIsTuningVisible(false);
    tuneRef.current?.pause();
    setTvState(TV_STATE.BOOTING);
    if (!v || !FIRST_SRC) return;
    v.loop = true; // first.mp4 loops until the viewer changes channel
    sw.expectedSrc = loadChannel(FIRST_SRC);
    v.play().catch(() => {});
  }, [loadChannel, setTvState]);

  const switchTo = useCallback((nextIdx) => {
    const list = shuffledRef.current;
    const v = videoRef.current;
    if (!v || !list.length || stateRef.current === TV_STATE.OFF) return;

    const safeIdx = ((nextIdx % list.length) + list.length) % list.length;
    const sw = switchRef.current;
    sw.token += 1;
    sw.target = safeIdx;
    sw.channelReady = false;
    sw.revealPending = false;
    setTargetIndex(safeIdx);
    setKnobAngle((a) => a + 36);

    // Start the tuning clip only if we're not already tuning — a rapid second
    // click keeps the static running instead of restarting it.
    if (stateRef.current !== TV_STATE.SWITCHING) {
      const t = tuneRef.current;
      if (t && TUNING_SRC) {
        sw.tuneDone = false;
        if (t.currentTime !== 0) t.currentTime = 0;
        t.play().catch(() => {
          sw.tuneDone = true;
          finishSwitchIfReady();
        });
      } else {
        sw.tuneDone = true;
      }
      // Show the layer in this same task, before the channel src changes
      // below. Updates from native media events (auto-advance on `ended`)
      // may be flushed by React after a paint; this guarantees the old
      // channel is never replaced by an empty frame on screen. The state
      // update keeps React's view of the style in sync.
      if (t && TUNING_SRC) t.style.opacity = '1';
      setIsTuningVisible(true);
      setTvState(TV_STATE.SWITCHING);
    }

    // Old channel stops; the new one loads underneath the tuning layer.
    v.loop = false;
    sw.expectedSrc = loadChannel(toPlayableSrc(list[safeIdx].url));
  }, [finishSwitchIfReady, loadChannel, setTvState]);

  // ── Mount: wire media events once, preload the tuning clip, boot ──────────
  useEffect(() => {
    const v = videoRef.current;
    const t = tuneRef.current;
    const sw = switchRef.current;
    if (!v) return undefined;

    const isCurrent = () => v.src === switchRef.current.expectedSrc;

    const onCanPlay = () => {
      if (!isCurrent()) return;
      if (stateRef.current === TV_STATE.SWITCHING) {
        switchRef.current.channelReady = true;
        finishSwitchIfReady();
      }
    };
    const onPlaying = () => {
      if (isCurrent() && switchRef.current.revealPending) revealChannel();
    };
    const onEnded = () => {
      // BOOTING loops natively; a channel ending auto-advances through the
      // same tuning transition as a manual change.
      if (isCurrent() && stateRef.current === TV_STATE.PLAYING) switchTo(indexRef.current + 1);
    };
    const onTimeUpdate = () => { if (isCurrent()) setCurrentTime(v.currentTime); };
    const onDurationChange = () => { if (isCurrent()) setDuration(Number.isFinite(v.duration) ? v.duration : 0); };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => {
      // A pause issued by a channel change isn't the viewer pausing.
      if (stateRef.current !== TV_STATE.SWITCHING) setIsPlaying(false);
    };

    const onTuneEnded = () => {
      const sw = switchRef.current;
      sw.tuneDone = true;
      // Channel still buffering → hold the static by looping the clip.
      if (!finishSwitchIfReady() && stateRef.current === TV_STATE.SWITCHING && t) {
        t.currentTime = 0;
        t.play().catch(() => {});
      }
    };

    v.addEventListener('canplay', onCanPlay);
    v.addEventListener('playing', onPlaying);
    v.addEventListener('ended', onEnded);
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('durationchange', onDurationChange);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    t?.addEventListener('ended', onTuneEnded);

    if (t && TUNING_SRC) {
      t.src = TUNING_SRC;
      t.preload = 'auto';
      t.load();
    }

    const fresh = shufflePlaylist(getChannelPlaylist());
    shuffledRef.current = fresh;
    setShuffled(fresh);
    indexRef.current = 0;
    setCurrentIndex(0);
    setIsPowered(true);
    boot();

    return () => {
      v.removeEventListener('canplay', onCanPlay);
      v.removeEventListener('playing', onPlaying);
      v.removeEventListener('ended', onEnded);
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('durationchange', onDurationChange);
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      t?.removeEventListener('ended', onTuneEnded);
      // Stop downloading when the modal closes.
      sw.token += 1;
      [v, t].forEach((el) => {
        if (!el) return;
        el.pause();
        el.removeAttribute('src');
        el.load();
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Volume / mute (applies to both layers) ─────────────────────────────────
  useEffect(() => {
    [videoRef.current, tuneRef.current].forEach((el) => {
      if (!el) return;
      el.muted = isMuted;
      el.volume = volume;
    });
  }, [isMuted, volume]);

  // ── Public controls ────────────────────────────────────────────────────────
  const play = useCallback(() => {
    if (stateRef.current === TV_STATE.PLAYING || stateRef.current === TV_STATE.BOOTING) {
      videoRef.current?.play().catch(() => {});
    }
  }, []);

  const pause = useCallback(() => {
    if (stateRef.current === TV_STATE.PLAYING || stateRef.current === TV_STATE.BOOTING) {
      videoRef.current?.pause();
    }
  }, []);

  const seek = useCallback((time) => {
    if (stateRef.current === TV_STATE.PLAYING && videoRef.current) videoRef.current.currentTime = time;
  }, []);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    setIsMuted(val === 0);
  }, []);

  const toggleMute = useCallback(() => setIsMuted((m) => !m), []);

  // Channel buttons work from BOOTING, PLAYING and mid-SWITCHING (retargets).
  const nextChannel = useCallback(() => {
    const s = stateRef.current;
    if (s === TV_STATE.OFF) return;
    const base = s === TV_STATE.BOOTING ? -1 : s === TV_STATE.SWITCHING ? switchRef.current.target : indexRef.current;
    switchTo(base + 1);
  }, [switchTo]);

  const prevChannel = useCallback(() => {
    const s = stateRef.current;
    if (s === TV_STATE.OFF) return;
    const base = s === TV_STATE.BOOTING ? 0 : s === TV_STATE.SWITCHING ? switchRef.current.target : indexRef.current;
    switchTo(base - 1);
  }, [switchTo]);

  const togglePower = useCallback(() => {
    if (stateRef.current !== TV_STATE.OFF) {
      switchRef.current.token += 1;
      videoRef.current?.pause();
      tuneRef.current?.pause();
      setIsTuningVisible(false);
      setIsPlaying(false);
      setIsPowered(false);
      setTvState(TV_STATE.OFF);
    } else {
      const fresh = shufflePlaylist(getChannelPlaylist());
      shuffledRef.current = fresh;
      setShuffled(fresh);
      indexRef.current = 0;
      setCurrentIndex(0);
      setIsPowered(true);
      boot();
    }
  }, [boot, setTvState]);

  const requestFullscreen = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    (v.requestFullscreen || v.webkitRequestFullscreen)?.call(v);
  }, []);

  const currentVideo = tvState === TV_STATE.BOOTING
    ? FIRST_VIDEO
    : tvState === TV_STATE.PLAYING
      ? shuffled[currentIndex] || null
      : tvState === TV_STATE.SWITCHING
        ? MIDDLE_VIDEO
        : null;

  return {
    videoRef, tuneRef,
    tvState, isPowered, isTuningVisible,
    currentVideo, currentIndex,
    // During a switch the OSD shows the channel being tuned to.
    channelNumber: (tvState === TV_STATE.SWITCHING ? targetIndex : currentIndex) + 1,
    totalVideos: shuffled.length,
    isPlaying, isMuted, volume, currentTime, duration, knobAngle,
    play, pause, seek, changeVolume, toggleMute,
    nextChannel, prevChannel, togglePower, requestFullscreen,
  };
}
