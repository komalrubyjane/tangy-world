import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

const MAX_BYTES = 50 * 1024 * 1024; // 50MB, matches the copy below

function formatBytes(bytes) {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

// Real Supabase Storage uploads (private 'artist-media' bucket) + metadata
// rows in artist_media — see 0013_artist_media.sql. Replaces a previous
// version that faked uploads entirely in local state.
export const MediaPage = () => {
  const { playSFX } = useAudio();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from('artist_media').select('*').eq('artist_id', user.id).order('created_at', { ascending: false });
    setTracks(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_BYTES) { setError('File is larger than 50MB.'); return; }

    playSFX('ticketClick');
    setError('');
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage.from('artist-media').upload(path, file);
    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from('artist_media').insert({
      artist_id: user.id,
      storage_path: path,
      file_name: file.name,
      file_size_bytes: file.size,
    });
    setUploading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setUploadMsg('✓ UPLOADED — AWAITING CURATION REVIEW.');
    window.setTimeout(() => setUploadMsg(''), 3500);
    load();
  };

  const handleDelete = async (track) => {
    await supabase.storage.from('artist-media').remove([track.storage_path]);
    await supabase.from('artist_media').delete().eq('id', track.id);
    load();
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-6xl mx-auto flex flex-col gap-6 text-left">

      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">ARTIST WORKSPACE // MEDIA MANAGER</span>
          <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none mt-1">AUDIO & GALLERY DEMOS</h1>
          <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase">Upload live sets, unreleased stems, and high-res photography for Tangy Sessions curation.</p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#191410] hover:bg-[#191410] transition-all disabled:opacity-50"
        >
          {uploading ? 'UPLOADING...' : '+ UPLOAD NEW DEMO'}
        </button>
        <input ref={fileInputRef} type="file" accept="audio/*,image/*" onChange={handleFileChange} className="hidden" />
      </div>

      {uploadMsg && <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">{uploadMsg}</div>}
      {error && <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">{error}</div>}

      <div
        onClick={() => fileInputRef.current?.click()}
        className="bg-[#e9decb] text-[#241a12] border-4 border-dashed border-[#191410] p-10 sm:p-14 shadow-[8px_8px_0px_#191410] text-center flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-[#ecdcaf] transition-all"
      >
        <span className="text-5xl">🎵</span>
        <span className="font-poster text-2xl text-[#191410]">CLICK TO UPLOAD</span>
        <span className="font-mono text-xs text-[#241a12]/70 uppercase">SUPPORTED FORMATS: MP3, WAV, FLAC (UP TO 50MB) · JPG, PNG GALLERY IMAGES</span>
      </div>

      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[8px_8px_0px_#191410] flex flex-col gap-4">
        <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">YOUR UPLOADED DEMOS ({tracks.length})</span>

        {loading ? (
          <div className="text-center font-mono text-xs opacity-50 py-6">LOADING...</div>
        ) : tracks.length === 0 ? (
          <div className="text-center font-mono text-xs opacity-50 py-6">NO UPLOADS YET.</div>
        ) : (
          <div className="flex flex-col gap-3 font-mono text-xs">
            {tracks.map((t) => (
              <div key={t.id} className="p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">▶</span>
                  <div>
                    <h3 className="font-bold text-[#191410]">{t.file_name}</h3>
                    <span className="text-[9.5px] text-[#241a12]/70">{formatBytes(t.file_size_bytes)} · {new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-[9px] font-bold uppercase border border-[#191410] ${t.status === 'approved' ? 'bg-[#2e6834] text-[#ecdcaf]' : t.status === 'rejected' ? 'bg-[#c2272a] text-[#ecdcaf]' : 'bg-[#d1a437] text-[#191410]'}`}>
                    {t.status}
                  </span>
                  <button onClick={() => handleDelete(t)} className="text-[#c2272a] font-bold text-xs uppercase">DELETE ✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
