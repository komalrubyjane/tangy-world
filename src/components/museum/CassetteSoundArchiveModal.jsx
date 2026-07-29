import { useState, useEffect, useRef } from 'react';
import { soundArchive } from '../../data/mockData';
import { useAudio } from '../../audio/AudioContext';

export const CassetteSoundArchiveModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const [selectedTrack, setSelectedTrack] = useState(soundArchive[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [vuLevel, setVuLevel] = useState(40);
  const audioCtxRef = useRef(null);
  const oscRef = useRef(null);
  const gainRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setVuLevel(Math.floor(30 + Math.random() * 65));
      }, 100);
    } else {
      setVuLevel(10);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = (track) => {
    playSFX('ticketClick');
    if (selectedTrack.id === track.id && isPlaying) {
      stopAudio();
      setIsPlaying(false);
    } else {
      setSelectedTrack(track);
      startAudio(track);
      setIsPlaying(true);
    }
  };

  const startAudio = (track) => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      if (oscRef.current) {
        oscRef.current.stop();
      }

      // Generate ambient drone pitch
      const freq = track.freq === '432 Hz' ? 108 : track.freq === '440 Hz' ? 110 : 132;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscRef.current = osc;
      gainRef.current = gain;
    } catch (err) {
      console.log('Audio Context unavailable', err);
    }
  };

  const stopAudio = () => {
    try {
      if (gainRef.current && audioCtxRef.current) {
        gainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
        setTimeout(() => {
          if (oscRef.current) {
            oscRef.current.stop();
            oscRef.current = null;
          }
        }, 150);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleClose = () => {
    stopAudio();
    setIsPlaying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={handleClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* 1970s CASSETTE TAPE DECK PLAYER */}
      <div className="relative w-full max-w-2xl bg-[#191410] text-[#ecdcaf] border-4 border-[#d1a437] p-6 shadow-[12px_12px_0px_#4c1210] flex flex-col gap-6 z-10 overflow-hidden">
        
        {/* TOP HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">📻 SOUND ARCHIVE // CASSETTE DECK</span>
            <span className="w-2 h-2 rounded-full bg-[#c2272a] animate-pulse" />
          </div>
          <button 
            onClick={handleClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* CASSETTE TAPE DISPLAY WINDOW */}
        <div className="w-full bg-[#0d0a07] border-2 border-[#ecdcaf]/40 p-4 flex flex-col items-center gap-4 relative">
          
          {/* TAPE REELS */}
          <div className="w-full flex justify-around items-center py-3">
            <div className={`w-20 h-20 rounded-full border-4 border-[#ecdcaf]/50 flex items-center justify-center relative ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-[#d1a437]/30 border-2 border-[#d1a437]" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#ecdcaf]/60" />
            </div>

            {/* CASSETTE TAPE BRAND LABEL */}
            <div className="flex flex-col items-center text-center px-4">
              <span className="font-poster text-lg text-[#d1a437] tracking-widest">TANGY C-90</span>
              <span className="font-mono text-[9px] text-[#ecdcaf]/70 uppercase">{selectedTrack.freq} · HIGH BIAS</span>
              <span className="font-mono text-[10px] text-[#c2272a] font-bold mt-1 truncate max-w-[200px]">{selectedTrack.title}</span>
            </div>

            <div className={`w-20 h-20 rounded-full border-4 border-[#ecdcaf]/50 flex items-center justify-center relative ${isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`}>
              <div className="w-8 h-8 rounded-full bg-[#d1a437]/30 border-2 border-[#d1a437]" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#ecdcaf]/60" />
            </div>
          </div>

          {/* VU METERS */}
          <div className="w-full flex justify-between items-center bg-[#191410] px-4 py-2 border border-[#ecdcaf]/20 font-mono text-[9px]">
            <span className="text-[#d1a437]">VU LEVEL:</span>
            <div className="flex-1 mx-3 h-3 bg-[#0d0a07] border border-[#ecdcaf]/30 relative overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-600 transition-all duration-100"
                style={{ width: `${vuLevel}%` }}
              />
            </div>
            <span>{isPlaying ? `${vuLevel} dB` : 'MUTED'}</span>
          </div>
        </div>

        {/* SOUNDTRACK ARCHIVE TRACK LIST */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          {soundArchive.map((track) => (
            <div 
              key={track.id}
              onClick={() => togglePlay(track)}
              className={`p-3 border flex items-center justify-between cursor-pointer transition-all ${selectedTrack.id === track.id && isPlaying ? 'bg-[#c2272a] text-[#ecdcaf] border-[#ecdcaf]' : 'bg-[#191410] text-[#ecdcaf] border-[#ecdcaf]/20 hover:border-[#d1a437]'}`}
            >
              <div className="flex items-center gap-3 text-left">
                <span className="font-mono font-bold text-xs">{selectedTrack.id === track.id && isPlaying ? '▶' : '⏵'}</span>
                <div>
                  <h4 className="font-poster text-sm tracking-wide">{track.title}</h4>
                  <p className="font-mono text-[9px] opacity-80">{track.note}</p>
                </div>
              </div>
              <span className="font-mono text-xs font-bold">{track.duration}</span>
            </div>
          ))}
        </div>

        {/* PLAYER CONTROLS FOOTER */}
        <div className="flex justify-between items-center border-t border-[#ecdcaf]/20 pt-3 font-mono text-[10px]">
          <span className="text-[#ecdcaf]/70">1970s CASSETTE SOUNDSCAPE ARCHIVE</span>
          <button
            onClick={() => togglePlay(selectedTrack)}
            className="px-6 py-2 bg-[#d1a437] text-[#191410] font-bold tracking-widest uppercase hover:bg-[#ecdcaf] transition-all"
          >
            {isPlaying ? 'PAUSE TAPE ⏸' : 'PLAY TAPE ▶'}
          </button>
        </div>

      </div>
    </div>
  );
};
