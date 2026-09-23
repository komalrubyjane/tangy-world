import React from 'react';

// Shared small button style
const btnBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 44, minHeight: 44, padding: '6px 10px',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem',
  color: '#888', fontFamily: "'Space Mono', monospace",
  transition: 'all 0.15s', userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
};

function Btn({ label, title, onClick, disabled, active }) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        color:      disabled ? '#2a2a2a' : active ? '#C99A2E' : '#888',
        background: active ? 'rgba(201,154,46,0.12)' : btnBase.background,
        border:     active ? '1px solid rgba(201,154,46,0.35)' : btnBase.border,
        cursor:     disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );
}

// ─── Rotating Knob ────────────────────────────────────────────────────────────
// VOL: left-half click = decrease, right-half click = increase
// CH:  left-half click = prev,     right-half click = next
function Knob({ label, angle, onLeft, onRight }) {
  const [pressed, setPressed] = React.useState(null); // 'left' | 'right' | null

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isRight = e.clientX > rect.left + rect.width / 2;
    if (isRight) onRight?.();
    else onLeft?.();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{
        fontFamily:"'Space Mono', monospace", fontSize:'0.4rem',
        letterSpacing:'0.18em', color:'rgba(201,154,46,0.4)', textTransform:'uppercase',
      }}>{label}</div>

      {/* Knob body */}
      <div
        onClick={handleClick}
        onPointerDown={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          setPressed(e.clientX > rect.left + rect.width / 2 ? 'right' : 'left');
        }}
        onPointerUp={() => setPressed(null)}
        onPointerLeave={() => setPressed(null)}
        title={label === 'VOL' ? 'Left = volume down  |  Right = volume up' : 'Left = prev channel  |  Right = next channel'}
        style={{
          width: 44, height: 44, borderRadius: '50%', cursor: 'pointer',
          background: pressed
            ? pressed === 'right'
              ? 'radial-gradient(circle at 65% 35%, #5a5a5a 0%, #1e1e1e 55%, #111 100%)'
              : 'radial-gradient(circle at 35% 35%, #5a5a5a 0%, #1e1e1e 55%, #111 100%)'
            : 'radial-gradient(circle at 35% 35%, #4a4a4a 0%, #1e1e1e 55%, #111 100%)',
          border: '2px solid rgba(201,154,46,0.22)',
          boxShadow: pressed
            ? '0 2px 8px rgba(0,0,0,0.8), inset 0 2px 4px rgba(0,0,0,0.5)'
            : '0 4px 14px rgba(0,0,0,0.75), inset 0 1px 3px rgba(255,255,255,0.1)',
          position: 'relative',
          transform: `rotate(${angle}deg)`,
          transition: 'transform 0.25s ease, box-shadow 0.1s',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {/* Indicator line */}
        <div style={{
          position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
          width: 3, height: 10, background: '#C99A2E', borderRadius: 2,
          boxShadow: '0 0 5px #C99A2E',
        }} />
        {/* Left / Right hint zones (invisible, for visual cue only) */}
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', overflow:'hidden', display:'flex' }}>
          <div style={{ flex:1, opacity: pressed === 'left' ? 0.15 : 0, background:'#C99A2E', transition:'opacity 0.1s' }} />
          <div style={{ flex:1, opacity: pressed === 'right' ? 0.15 : 0, background:'#C99A2E', transition:'opacity 0.1s' }} />
        </div>
      </div>

      {/* ± hint labels */}
      {label === 'VOL' && (
        <div style={{ display:'flex', gap:8, fontSize:'0.38rem', color:'rgba(201,154,46,0.3)', fontFamily:"'Space Mono', monospace", letterSpacing:'0.1em' }}>
          <span>−</span><span>+</span>
        </div>
      )}
    </div>
  );
}

// ─── TVKnobs ──────────────────────────────────────────────────────────────────
export function TVKnobs({ volume, knobAngle, changeVolume, nextChannel, prevChannel }) {
  // VOL angle: maps 0→1 to -135°→+135° (270° sweep)
  const volAngle = -135 + volume * 270;

  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:20, flexShrink:0 }}>
      <Knob
        label="VOL"
        angle={volAngle}
        onLeft={() => changeVolume(Math.max(0, parseFloat((volume - 0.1).toFixed(2))))}
        onRight={() => changeVolume(Math.min(1, parseFloat((volume + 0.1).toFixed(2))))}
      />
      <Knob
        label="CH"
        angle={knobAngle}
        onLeft={prevChannel}
        onRight={nextChannel}
      />
    </div>
  );
}

function formatTime(s) {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
}

// ─── Power Button ─────────────────────────────────────────────────────────────
function PowerBtn({ isPowered, togglePower }) {
  return (
    <button
      onClick={togglePower}
      title={isPowered ? 'Power Off' : 'Power On'}
      style={{
        width:40, height:40, borderRadius:'50%', border:'none',
        background: isPowered
          ? 'radial-gradient(circle, #C2272A 0%, #4c1210 100%)'
          : 'radial-gradient(circle, #2a2a2a 0%, #111 100%)',
        boxShadow: isPowered ? '0 0 14px rgba(194,39,42,0.55)' : '0 2px 6px rgba(0,0,0,0.5)',
        cursor:'pointer', fontSize:'1rem', flexShrink:0,
        transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center',
        minWidth:44, minHeight:44,
      }}
    >⏻</button>
  );
}

// ─── Main TVControls ──────────────────────────────────────────────────────────
export default function TVControls({
  tvState, isPowered,
  currentVideo, channelNumber, totalVideos,
  isPlaying, isMuted, volume, currentTime, duration, knobAngle,
  play, pause, seek, changeVolume, toggleMute,
  nextChannel, prevChannel, togglePower, requestFullscreen,
}) {
  const canPlay    = isPowered;
  const canSeek    = isPowered && tvState === 'PLAYING';
  const titleText  = currentVideo?.filename
    ? currentVideo.filename.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).slice(0, 35)
    : '— — —';
  // currentTime/duration come from the channel <video> only (useTVPlayer
  // resets them on every source change). Outside PLAYING — booting or
  // tuning — there is no real channel position to show, so the bar stays
  // empty; the clamp guards against any stale duration/time pairing.
  const showProgress = tvState === 'PLAYING';
  const progress   = showProgress && duration > 0
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

  return (
    <div style={{
      background:'linear-gradient(180deg, #0d0d0d 0%, #131313 100%)',
      border:'1px solid rgba(201,154,46,0.12)',
      borderTop:'none', padding:'12px 14px',
      display:'flex', flexDirection:'column', gap:10,
      fontFamily:"'Space Mono', monospace",
    }}>

      {/* Row 1 — Now Playing info */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:'0.4rem', letterSpacing:'0.2em', color:'rgba(201,154,46,0.45)', marginBottom:2 }}>
            NOW PLAYING
          </div>
          <div style={{
            fontSize:'clamp(0.55rem, 1.4vw, 0.72rem)', color: isPowered ? '#fff' : '#333',
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>
            {isPowered ? titleText : '— — —'}
          </div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:'0.6rem', color:'#C99A2E', letterSpacing:'0.12em' }}>
            CH {String(isPowered ? channelNumber : '--').padStart(2,'0')}
          </div>
          <div style={{ fontSize:'0.45rem', color:'rgba(255,255,255,0.28)', letterSpacing:'0.1em' }}>
            {isPowered && totalVideos ? `${String(channelNumber).padStart(2,'0')} / ${String(totalVideos).padStart(2,'0')}` : '--/--'}
          </div>
        </div>
      </div>

      {/* Row 2 — Progress bar */}
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ fontSize:'0.45rem', color:'rgba(255,255,255,0.3)', minWidth:28 }}>
          {showProgress ? formatTime(currentTime) : '0:00'}
        </span>
        <div
          style={{ flex:1, height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden', cursor: canSeek ? 'pointer' : 'default', position:'relative' }}
          onClick={e => {
            if (!canSeek || !duration) return;
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
        >
          <div style={{ position:'absolute', top:0, left:0, height:'100%', borderRadius:3,
            width:`${progress}%`, background: canSeek ? '#C99A2E' : '#2a2a2a', transition:'width 0.2s linear' }} />
        </div>
        <span style={{ fontSize:'0.45rem', color:'rgba(255,255,255,0.3)', minWidth:28, textAlign:'right' }}>
          {showProgress ? formatTime(duration) : '0:00'}
        </span>
      </div>

      {/* Row 3 — Buttons + Knobs + Power */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>

        {/* Playback row */}
        <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap' }}>
          <Btn label="⏮" title="Previous" onClick={prevChannel} disabled={!canPlay} />
          {isPlaying
            ? <Btn label="⏸" title="Pause"  onClick={pause}       disabled={!canPlay} active />
            : <Btn label="▶" title="Play"   onClick={play}        disabled={!canPlay} active />
          }
          <Btn label="⏭" title="Next"       onClick={nextChannel} disabled={!canPlay} />
          <Btn label={isMuted ? '🔇' : '🔊'} title={isMuted ? 'Unmute' : 'Mute'} onClick={toggleMute} disabled={!canPlay} />
          <Btn label="⛶"  title="Fullscreen" onClick={requestFullscreen} disabled={!canPlay} />
        </div>

        {/* Knobs */}
        <TVKnobs
          volume={volume} knobAngle={knobAngle}
          changeVolume={changeVolume}
          nextChannel={nextChannel} prevChannel={prevChannel}
        />

        {/* Power */}
        <PowerBtn isPowered={isPowered} togglePower={togglePower} />
      </div>

    </div>
  );
}
