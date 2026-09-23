import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTVPlayer } from './useTVPlayer.js';
import TVHeader from './TVHeader.jsx';
import TVScreen from './TVScreen.jsx';
import TVControls from './TVControls.jsx';

// Ported from the sibling "tangy" project's RetroTV component (originally a
// hero-grid child there). Adapted here to stand alone inside a modal — the
// hero-grid-relative ambient glow and scroll-visibility pause were dropped
// since a modal is either fully visible or unmounted, never partially
// scrolled past.

const TV_STYLES = `
  @keyframes tvFlicker {
    0%, 94%, 100% { opacity: 1; }
    95% { opacity: 0.75; }
    96% { opacity: 1; }
    98% { opacity: 0.5; }
    99% { opacity: 0.95; }
  }
  @keyframes tvGlowPulse {
    0%, 100% { opacity: 0.4; }
    50%       { opacity: 0.8; }
  }
`;

export default function TVPlayer() {
  const tv = useTVPlayer();
  const wrapRef = useRef(null);

  return (
    <>
      <style>{TV_STYLES}</style>

      {/* Ambient glow behind the TV */}
      <div
        style={{
          position: 'absolute',
          inset: '-6%',
          background: 'radial-gradient(ellipse, rgba(201,154,46,0.10) 0%, transparent 68%)',
          filter: 'blur(30px)',
          zIndex: 0,
          pointerEvents: 'none',
          animation: 'tvGlowPulse 5s ease-in-out infinite',
        }}
      />

      <motion.div
        ref={wrapRef}
        className="tangy-tv-wrapper"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 28px 64px rgba(0,0,0,0.85)',
        }}
      >
        {/* Classic V-shaped rabbit-ear antenna, mounted on top of the chassis */}
        <svg
          width="96" height="54" viewBox="0 0 96 54"
          style={{ position: 'absolute', top: -46, left: '50%', transform: 'translateX(-50%)', zIndex: 2, pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <line x1="48" y1="50" x2="15" y2="4" stroke="#8a8578" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="50" x2="81" y2="4" stroke="#8a8578" strokeWidth="3" strokeLinecap="round" />
          <circle cx="15" cy="4" r="3.5" fill="#C99A2E" />
          <circle cx="81" cy="4" r="3.5" fill="#C99A2E" />
          <circle cx="48" cy="50" r="4.5" fill="#3a352c" />
        </svg>

        <TVHeader
          tvState={tv.tvState}
          channelNumber={tv.channelNumber}
          isPowered={tv.isPowered}
        />

        {/* Chassis */}
        <div
          style={{
            background: 'linear-gradient(160deg, #1c1c1c 0%, #111 60%, #0c0c0c 100%)',
            border: '1px solid rgba(201,154,46,0.10)',
            borderTop: 'none',
            borderBottom: 'none',
            padding: '10px 10px 8px',
          }}
        >
          <TVScreen
            videoRef={tv.videoRef}
            tvState={tv.tvState}
            isPowered={tv.isPowered}
            isVideoReady={tv.isVideoReady}
            channelNumber={tv.channelNumber}
          />
        </div>

        <TVControls
          tvState={tv.tvState}
          isPowered={tv.isPowered}
          currentVideo={tv.currentVideo}
          channelNumber={tv.channelNumber}
          totalVideos={tv.totalVideos}
          isPlaying={tv.isPlaying}
          isMuted={tv.isMuted}
          volume={tv.volume}
          currentTime={tv.currentTime}
          duration={tv.duration}
          knobAngle={tv.knobAngle}
          play={tv.play}
          pause={tv.pause}
          seek={tv.seek}
          changeVolume={tv.changeVolume}
          toggleMute={tv.toggleMute}
          nextChannel={tv.nextChannel}
          prevChannel={tv.prevChannel}
          togglePower={tv.togglePower}
          requestFullscreen={tv.requestFullscreen}
        />
      </motion.div>
    </>
  );
}
