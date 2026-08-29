import React from 'react';
import { TV_STATE } from './useTVPlayer.js';

export default function TVHeader({ tvState, channelNumber, isPowered }) {
  const statusColor = {
    [TV_STATE.BOOTING]:   '#C2272A',
    [TV_STATE.SWITCHING]: '#d1a437',
    [TV_STATE.PLAYING]:   '#C99A2E',
    [TV_STATE.OFF]:       '#333',
  }[tvState] || '#333';

  const statusLabel = {
    [TV_STATE.BOOTING]:   'BOOTING',
    [TV_STATE.SWITCHING]: 'TUNING',
    [TV_STATE.PLAYING]:   'LIVE',
    [TV_STATE.OFF]:       'OFF',
  }[tvState] || 'OFF';

  return (
    <div style={{
      background: 'linear-gradient(180deg, #1c1c1c 0%, #121212 100%)',
      border: '1px solid rgba(201,154,46,0.12)',
      borderBottom: 'none',
      padding: '8px 14px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 6,
      fontFamily: "'Space Mono', monospace",
      minHeight: 44,
    }}>
      {/* Brand */}
      <div>
        <div style={{ fontSize: 'clamp(0.65rem, 1.8vw, 0.85rem)', fontWeight: 700, letterSpacing: '0.14em', color: '#C99A2E', lineHeight: 1.2 }}>
          TANGY SESSIONS TV
        </div>
        <div style={{ fontSize: 'clamp(0.4rem, 1vw, 0.5rem)', letterSpacing: '0.2em', color: 'rgba(201,154,46,0.4)', marginTop: 1 }}>
          LIVE ARCHIVE · EST.2025
        </div>
      </div>

      {/* Centre cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Status dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
            background: statusColor,
            boxShadow: isPowered ? `0 0 7px ${statusColor}` : 'none',
            animation: isPowered && tvState !== TV_STATE.OFF ? 'blinkDot 1.5s infinite' : 'none',
          }} />
          <span style={{ fontSize: 'clamp(0.4rem, 1vw, 0.52rem)', letterSpacing: '0.18em', color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* Channel badge */}
        <div style={{
          padding: '2px 8px',
          background: 'rgba(201,154,46,0.07)',
          border: '1px solid rgba(201,154,46,0.18)',
          fontSize: 'clamp(0.45rem, 1.1vw, 0.58rem)',
          letterSpacing: '0.18em',
          color: '#C99A2E',
        }}>
          CH {String(isPowered ? channelNumber : '--').padStart(2, '0')}
        </div>
      </div>

      {/* Right cluster */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 'clamp(0.38rem, 0.9vw, 0.48rem)', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>
          SIGNAL {isPowered ? '100%' : '0%'}
        </span>
        {isPowered && tvState === TV_STATE.PLAYING && (
          <span style={{
            fontSize: 'clamp(0.38rem, 0.9vw, 0.48rem)', letterSpacing: '0.15em',
            color: '#C2272A', animation: 'blinkDot 1s infinite',
          }}>
            REC ●
          </span>
        )}
      </div>
    </div>
  );
}
