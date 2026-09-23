import { TV_STATE } from './useTVPlayer.js';

// ─── CRT glass / effects overlay ─────────────────────────────────────────────
function CRTLayer() {
  return (
    <>
      {/* Scanlines */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:2,
        background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0px, rgba(0,0,0,0.10) 1px, transparent 1px, transparent 3px)' }} />
      {/* Vignette */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:3,
        background: 'radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.80) 100%)' }} />
      {/* Glass glint */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:4,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.02) 100%)' }} />
      {/* Bloom edge */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:5,
        boxShadow: 'inset 0 0 28px rgba(201,154,46,0.04)' }} />
    </>
  );
}

// ─── OSD overlay text ─────────────────────────────────────────────────────────
// Text only (no fill) — it never hides or reveals the picture; the tuning
// layer below is what covers a channel change.
const OSD_FONT = "var(--font-mono), 'DM Mono', monospace";

function OSD({ tvState, channelNumber }) {
  if (tvState === TV_STATE.BOOTING) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none',
        display:'flex', flexDirection:'column', padding:'8% 7%', gap:6 }}>
        <div style={{ fontFamily:OSD_FONT, color:'#C99A2E',
          textShadow:'0 0 12px #C99A2E', animation:'tvFlicker 3s infinite',
          fontSize:'clamp(0.5rem, 2vw, 0.9rem)', letterSpacing:'0.16em', lineHeight:1.7 }}>
          TANGY SESSIONS TV<br/>
          <span style={{ fontSize:'0.85em', opacity:0.7 }}>BOOTING...</span><br/>
          <span style={{ fontSize:'0.75em', opacity:0.5 }}>SEARCHING FOR SIGNAL...</span>
        </div>
        <div style={{ marginTop:'auto', display:'flex', gap:10,
          fontFamily:OSD_FONT, fontSize:'clamp(0.38rem, 1.2vw, 0.5rem)', letterSpacing:'0.14em' }}>
          <span style={{ color:'#C2272A' }}>REC ●</span>
          <span style={{ color:'#C99A2E' }}>LIVE</span>
        </div>
      </div>
    );
  }
  if (tvState === TV_STATE.SWITCHING) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none',
        display:'flex', flexDirection:'column', padding:'8% 7%', gap:4 }}>
        <div style={{ fontFamily:OSD_FONT, color:'#d1a437',
          textShadow:'0 0 10px #d1a437',
          fontSize:'clamp(0.48rem, 1.8vw, 0.82rem)', letterSpacing:'0.14em', lineHeight:1.7 }}>
          SWITCHING CHANNEL...<br/>
          <span style={{ opacity:0.6 }}>CH {String(channelNumber).padStart(2,'0')}</span><br/>
          <span style={{ fontSize:'0.8em', opacity:0.4 }}>TUNING...</span>
        </div>
      </div>
    );
  }
  return null;
}

const VIDEO_STYLE = {
  position: 'absolute', inset: 0,
  width: '100%', height: '100%',
  objectFit: 'cover', display: 'block',
};

// ─── TVScreen ─────────────────────────────────────────────────────────────────
// Presentational only. Both <video> elements are ALWAYS mounted (never keyed,
// never conditionally rendered), and neither receives a src/load/play from
// here — useTVPlayer owns them. The tuning layer sits above the channel
// picture and is shown/hidden with an instant opacity switch; no CSS
// animation touches either video's opacity.
export default function TVScreen({ videoRef, tuneRef, tvState, isPowered, isTuningVisible, channelNumber }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16/9',
      background: '#000',
      overflow: 'hidden',
      borderRadius: 6,
      boxShadow: 'inset 0 0 30px rgba(0,0,0,0.95)',
    }}>
      {/* Channel picture */}
      <video ref={videoRef} muted playsInline preload="metadata" style={{ ...VIDEO_STYLE, zIndex: 0 }} />
      {/* Tuning layer (middle.mp4), decoded in advance */}
      <video
        ref={tuneRef}
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        style={{ ...VIDEO_STYLE, zIndex: 1, opacity: isTuningVisible ? 1 : 0 }}
      />
      <CRTLayer />
      <OSD tvState={tvState} channelNumber={channelNumber} />

      {!isPowered && (
        <div style={{
          position:'absolute', inset:0, zIndex:10,
          background:'radial-gradient(ellipse at center, #0f0f0f 0%, #030303 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontFamily:OSD_FONT, fontSize:'0.55rem',
            letterSpacing:'0.2em', color:'rgba(255,255,255,0.12)' }}>NO SIGNAL</span>
        </div>
      )}
    </div>
  );
}
