import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';
import { supabase } from '../../lib/supabaseClient';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { playSFX } = useAudio();
  const [tab, setTab] = useState('info');
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Seeded from the real artist row — no fictional persona fallback. An
  // unfilled field shows empty, not someone else's fake bio/handles.
  const [form, setForm] = useState({
    name: user?.name || '',
    genre: user?.genre || '',
    city: user?.city || '',
    bio: user?.bio || '',
    instagram: user?.instagram || '',
    soundcloud: user?.soundcloud || '',
    spotify: user?.spotify || '',
  });

  const [savedMsg, setSavedMsg] = useState('');

  const handleSaveInfo = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    updateUser({ name: form.name, genre: form.genre, city: form.city, bio: form.bio });
    setSavedMsg('PROFILE UPDATED SUCCESSFULLY!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleSaveLinks = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    updateUser({ instagram: form.instagram, soundcloud: form.soundcloud, spotify: form.spotify });
    setSavedMsg('SOCIAL LINKS UPDATED!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAvatarError('');
    setUploadingAvatar(true);
    const path = `${user.id}/avatar-${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('artist-avatars').upload(path, file, { upsert: true });
    if (uploadError) {
      setUploadingAvatar(false);
      setAvatarError(uploadError.message);
      return;
    }
    const { data } = supabase.storage.from('artist-avatars').getPublicUrl(path);
    updateUser({ avatar: data.publicUrl });
    setUploadingAvatar(false);
  };

  const tabs = ['info', 'media', 'links', 'settings'];

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-5xl mx-auto flex flex-col gap-6 text-left">

      {/* PROFILE HEADER CARD */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row items-center sm:items-start gap-6">

        <div
          onClick={() => avatarInputRef.current?.click()}
          className="w-24 h-24 bg-[#c2272a] text-[#ecdcaf] border-4 border-[#191410] shadow-[4px_4px_0px_#191410] flex items-center justify-center font-poster text-4xl cursor-pointer relative overflow-hidden group flex-shrink-0"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{user?.name ? user.name[0] : 'A'}</span>
          )}
          <div className="absolute inset-0 bg-[#191410]/80 text-[#ecdcaf] font-mono text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploadingAvatar ? 'UPLOADING...' : 'CHANGE'}
          </div>
        </div>
        <input ref={avatarInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />

        <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">ARTIST PROFILE MANAGER</span>
          <h1 className="font-poster text-4xl text-[#191410] leading-none">{user?.name || 'UNNAMED ARTIST'}</h1>
          <p className="font-mono text-xs text-[#241a12]/80 uppercase">{user?.genre || 'Genre not set'} · {user?.city || 'City not set'}</p>
          {avatarError && <p className="font-mono text-[10px] text-[#c2272a] mt-1">{avatarError}</p>}
          <div className="flex gap-2 mt-2 justify-center sm:justify-start">
            <button
              onClick={() => navigate(`/artist/profile/${user?.id}`)}
              className="px-3 py-1 bg-[#191410] text-[#ecdcaf] font-mono text-[10px] font-bold uppercase border border-[#191410]"
            >
              VIEW PUBLIC PROFILE ↗
            </button>
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">
          ✓ {savedMsg}
        </div>
      )}

      {/* SUB TABS NAVIGATION */}
      <div className="flex border-b-4 border-[#191410] gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { playSFX('ticketClick'); setTab(t); }}
            className={`px-5 py-2.5 font-mono text-xs font-bold uppercase border-t-2 border-x-2 border-[#191410] -mb-[4px] transition-all ${tab === t ? 'bg-[#e9decb] text-[#c2272a]' : 'bg-[#191410] text-[#ecdcaf]/70 hover:text-[#ecdcaf]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* TAB CONTENT CONTAINER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410]">

        {/* TAB 1: INFO */}
        {tab === 'info' && (
          <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">ARTIST NAME *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              </div>

              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">EMAIL ADDRESS</label>
                <input type="email" disabled value={user?.email || ''} className="w-full p-3 bg-[#ecdcaf]/50 border-2 border-[#191410]/40 font-mono text-xs text-[#191410] outline-none" />
              </div>

              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">GENRES *</label>
                <input type="text" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })} className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              </div>

              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">CITY / LOCATION *</label>
                <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none" />
              </div>
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">BIOGRAPHY</label>
              <textarea rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none" />
            </div>

            <div className="flex gap-3 mt-2">
              <button type="submit" className="px-6 py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] transition-all">
                SAVE CHANGES →
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MEDIA */}
        {tab === 'media' && (
          <div className="flex flex-col gap-4 items-start">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">DEMO TRACK & MEDIA UPLOADS</span>
            <p className="font-mono text-[11px] text-[#241a12]/70">Media uploads live in their own workspace, with curation status for each file.</p>
            <Link to="/artist/media" className="px-4 py-2.5 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410]">
              OPEN MEDIA MANAGER →
            </Link>
          </div>
        )}

        {/* TAB 3: LINKS */}
        {tab === 'links' && (
          <form onSubmit={handleSaveLinks} className="flex flex-col gap-4">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">SOCIAL & STREAMING PLATFORMS</span>

            {['instagram', 'soundcloud', 'spotify'].map((platform) => (
              <div key={platform}>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">{platform.toUpperCase()} URL</label>
                <input
                  type="text"
                  value={form[platform]}
                  onChange={(e) => setForm({ ...form, [platform]: e.target.value })}
                  className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
                />
              </div>
            ))}

            <button type="submit" className="px-6 py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] transition-all w-fit mt-2">
              SAVE SOCIAL LINKS →
            </button>
          </form>
        )}

        {/* TAB 4: SETTINGS */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-4 font-mono text-xs">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">ACCOUNT PREFERENCES</span>
            <p className="font-mono text-[10px] text-[#241a12]/60 normal-case">
              Notification preferences aren't wired to a real backend yet — nothing here is saved. Account-level settings live under Settings in the sidebar.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};
