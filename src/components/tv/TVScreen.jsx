import React from 'react';
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
      {/* RGB split */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:3, mixBlendMode:'screen',
        background: 'linear-gradient(90deg, rgba(255,0,0,0.012) 0%, rgba(0,255,0,0.008) 50%, rgba(0,0,255,0.012) 100%)' }} />
      {/* Bloom edge */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:5,
        boxShadow: 'inset 0 0 28px rgba(201,154,46,0.04)' }} />
    </>
  );
}

// ─── OSD overlay text ─────────────────────────────────────────────────────────
function OSD({ tvState, channelNumber }) {
  if (tvState === TV_STATE.BOOTING) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none',
        display:'flex', flexDirection:'column', padding:'8% 7%', gap:6 }}>
        <div style={{ fontFamily:"'Space Mono', monospace", color:'#C99A2E',
          textShadow:'0 0 12px #C99A2E', animation:'tvFlicker 3s infinite',
          fontSize:'clamp(0.5rem, 2vw, 0.9rem)', letterSpacing:'0.16em', lineHeight:1.7 }}>
          TANGY SESSIONS TV<br/>
          <span style={{ fontSize:'0.85em', opacity:0.7 }}>BOOTING...</span><br/>
          <span style={{ fontSize:'0.75em', opacity:0.5 }}>SEARCHING FOR SIGNAL...</span>
        </div>
        <div style={{ marginTop:'auto', display:'flex', gap:10,
          fontFamily:"'Space Mono', monospace", fontSize:'clamp(0.38rem, 1.2vw, 0.5rem)', letterSpacing:'0.14em' }}>
          <span style={{ color:'#C2272A', animation:'blinkDot 1s infinite' }}>REC ●</span>
          <span style={{ color:'#C99A2E' }}>LIVE</span>
        </div>
      </div>
    );
  }
  if (tvState === TV_STATE.SWITCHING) {
    return (
      <div style={{ position:'absolute', inset:0, zIndex:6, pointerEvents:'none',
        display:'flex', flexDirection:'column', padding:'8% 7%', gap:4 }}>
        <div style={{ fontFamily:"'Space Mono', monospace", color:'#d1a437',
          textShadow:'0 0 10px #d1a437', animation:'tvFlicker 0.8s infinite',
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

// ─── TVScreen ─────────────────────────────────────────────────────────────────
export default function TVScreen({ videoRef, tvState, isPowered, channelNumber }) {
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
      {isPowered ? (
        <>
          <video
            ref={videoRef}
            muted
            playsInline
            preload="metadata"
            style={{
              position:'absolute', inset:0,
              width:'100%', height:'100%',
              objectFit:'cover', display:'block',
              filter:'brightness(1.06) contrast(1.1) saturate(1.08)',
              animation: tvState !== TV_STATE.PLAYING ? 'tvFlicker 4s infinite' : 'none',
            }}
          />
          <CRTLayer />
          <OSD tvState={tvState} channelNumber={channelNumber} />
        </>
      ) : (
        <div style={{
          position:'absolute', inset:0,
          background:'radial-gradient(ellipse at center, #0f0f0f 0%, #030303 100%)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <span style={{ fontFamily:"'Space Mono', monospace", fontSize:'0.55rem',
            letterSpacing:'0.2em', color:'rgba(255,255,255,0.04)' }}>NO SIGNAL</span>
        </div>
      )}
    </div>
  );
}
