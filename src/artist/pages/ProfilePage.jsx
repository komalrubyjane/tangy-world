import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { playSFX } = useAudio();
  const [tab, setTab] = useState('info');

  const [form, setForm] = useState({
    name: user?.name || 'Arjun Mehta',
    email: user?.email || 'artist@tangysessions.in',
    genre: user?.genre || 'Techno / Deep House',
    city: user?.city || 'Hyderabad',
    bio: 'Sonic architect whose sets descend like ancient rituals — dark, ceremonial, and utterly consuming. Drawing from Hyderabad\'s layered stepwell acoustics.',
    instagram: '@arjunmehta.music',
    soundcloud: 'soundcloud.com/arjunmehta',
    spotify: 'open.spotify.com/artist/tangy'
  });

  const [savedMsg, setSavedMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    updateUser({ name: form.name, email: form.email, genre: form.genre, city: form.city });
    setSavedMsg('PROFILE UPDATED SUCCESSFULLY!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      updateUser({ avatar: url });
    }
  };

  const tabs = ['info', 'media', 'links', 'settings'];

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-5xl mx-auto flex flex-col gap-6 text-left">
      
      {/* PROFILE HEADER CARD */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row items-center sm:items-start gap-6">
        
        {/* AVATAR UPLOAD TRIGGER */}
        <div 
          onClick={() => document.getElementById('photoUpload').click()}
          className="w-24 h-24 bg-[#c2272a] text-[#ecdcaf] border-4 border-[#191410] shadow-[4px_4px_0px_#191410] flex items-center justify-center font-poster text-4xl cursor-pointer relative overflow-hidden group flex-shrink-0"
        >
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span>{user?.name ? user.name[0] : 'A'}</span>
          )}
          <div className="absolute inset-0 bg-[#191410]/80 text-[#ecdcaf] font-mono text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            CHANGE
          </div>
        </div>
        <input 
          type="file" 
          id="photoUpload" 
          className="hidden" 
          accept="image/*" 
          onChange={handleAvatarChange} 
        />

        <div className="flex-1 flex flex-col gap-1 text-center sm:text-left">
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            ARTIST PROFILE MANAGER
          </span>
          <h1 className="font-poster text-4xl text-[#191410] leading-none">
            {user?.name || 'ARJUN MEHTA'}
          </h1>
          <p className="font-mono text-xs text-[#241a12]/80 uppercase">
            {user?.genre || 'Techno / Deep House'} · {user?.city || 'Hyderabad'}
          </p>
          <div className="flex gap-2 mt-2 justify-center sm:justify-start">
            <button 
              onClick={() => navigate(`/artist/profile/${user?.id || 'A101'}`)}
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
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">ARTIST NAME *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">EMAIL ADDRESS *</label>
                <input 
                  type="email" 
                  value={form.email} 
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">GENRES *</label>
                <input 
                  type="text" 
                  value={form.genre} 
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
                />
              </div>

              <div>
                <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">CITY / LOCATION *</label>
                <input 
                  type="text" 
                  value={form.city} 
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">BIOGRAPHY *</label>
              <textarea 
                rows={5}
                value={form.bio} 
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                type="submit"
                className="px-6 py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] transition-all"
              >
                SAVE CHANGES →
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MEDIA */}
        {tab === 'media' && (
          <div className="flex flex-col gap-4">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">DEMO TRACK & MEDIA UPLOADS</span>
            
            <div className="border-4 border-dashed border-[#191410] bg-[#ecdcaf] p-8 text-center flex flex-col items-center justify-center gap-3 cursor-pointer">
              <span className="text-4xl">🎵</span>
              <span className="font-mono text-xs font-bold text-[#191410] uppercase">DRAG & DROP TRACKS OR IMAGES HERE</span>
              <span className="font-mono text-[10px] text-[#241a12]/60">MP3, WAV, FLAC (UP TO 50MB) · HIGH RES PHOTOS</span>
              <button className="px-4 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410]">
                BROWSE FILES
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: LINKS */}
        {tab === 'links' && (
          <form onSubmit={handleSave} className="flex flex-col gap-4">
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

            <button 
              type="submit"
              className="px-6 py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] transition-all w-fit mt-2"
            >
              SAVE SOCIAL LINKS →
            </button>
          </form>
        )}

        {/* TAB 4: SETTINGS */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-4 font-mono text-xs">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">ACCOUNT PREFERENCES</span>
            
            {[
              { label: 'Email notifications for bookings', defaultChecked: true },
              { label: 'Event invitation alerts', defaultChecked: true },
              { label: 'Profile visibility (Public roster)', defaultChecked: true },
              { label: 'Available for private bookings', defaultChecked: false },
            ].map((setting, idx) => (
              <label key={idx} className="flex items-center justify-between p-3 bg-[#ecdcaf] border-2 border-[#191410]">
                <span>{setting.label}</span>
                <input type="checkbox" defaultChecked={setting.defaultChecked} className="accent-[#c2272a] w-4 h-4" />
              </label>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
