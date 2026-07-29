import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const MediaPage = () => {
  const { playSFX } = useAudio();
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Bansilal Stepwell Rehearsal (Live).mp3', size: '14.2 MB', duration: '06:42', status: 'Approved' },
    { id: 2, name: 'Deep Descent - Modular Rough Mix.wav', size: '48.6 MB', duration: '08:15', status: 'Pending Review' }
  ]);

  const [uploadMsg, setUploadMsg] = useState('');

  const handleSimulateUpload = () => {
    playSFX('ticketClick');
    const newTrack = {
      id: Date.now(),
      name: 'New Demo Track Upload.wav',
      size: '22.4 MB',
      duration: '05:30',
      status: 'Pending Review'
    };
    setTracks(prev => [newTrack, ...prev]);
    setUploadMsg('DEMO TRACK UPLOADED TO CURATION SERVER!');
    setTimeout(() => setUploadMsg(''), 3500);
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-6 text-left">
      
      {/* HEADER BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            ARTIST WORKSPACE // MEDIA MANAGER
          </span>
          <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none mt-1">
            AUDIO & GALLERY DEMOS
          </h1>
          <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase">
            Upload live sets, unreleased stems, and high-res photography for Tangy Sessions curation.
          </p>
        </div>

        <button
          onClick={handleSimulateUpload}
          className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#191410] hover:bg-[#191410] transition-all"
        >
          + UPLOAD NEW DEMO
        </button>
      </div>

      {uploadMsg && (
        <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">
          ✓ {uploadMsg}
        </div>
      )}

      {/* DRAG AND DROP ZONE */}
      <div 
        onClick={handleSimulateUpload}
        className="bg-[#e9decb] text-[#241a12] border-4 border-dashed border-[#191410] p-10 sm:p-14 shadow-[8px_8px_0px_#191410] text-center flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#ecdcaf] transition-all"
      >
        <span className="text-5xl">🎵</span>
        <span className="font-poster text-2xl text-[#191410]">DROP FILES OR CLICK TO UPLOAD</span>
        <span className="font-mono text-xs text-[#241a12]/70 uppercase">
          SUPPORTED FORMATS: MP3, WAV, FLAC (UP TO 50MB) · JPG, PNG GALLERY IMAGES
        </span>
      </div>

      {/* UPLOADED TRACKS TABLE */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
        <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">
          YOUR UPLOADED DEMOS ({tracks.length})
        </span>

        <div className="flex flex-col gap-3 font-mono text-xs">
          {tracks.map((t) => (
            <div key={t.id} className="p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">▶</span>
                <div>
                  <h3 className="font-bold text-[#191410]">{t.name}</h3>
                  <span className="text-[9.5px] text-[#241a12]/70">{t.size} · DURATION {t.duration}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 text-[9px] font-bold uppercase border border-[#191410] ${t.status === 'Approved' ? 'bg-[#2e6834] text-[#ecdcaf]' : 'bg-[#d1a437] text-[#191410]'}`}>
                  {t.status}
                </span>
                <button 
                  onClick={() => setTracks(prev => prev.filter(x => x.id !== t.id))}
                  className="text-[#c2272a] font-bold text-xs uppercase"
                >
                  DELETE ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
