import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';

export const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { playSFX } = useAudio();
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    bookingAlerts: true,
    invitationAlerts: true,
    publicProfile: true,
    privateSessions: false,
  });

  const handleSave = () => {
    playSFX('ticketClick');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleDelete = () => {
    if (window.confirm('ARE YOU SURE YOU WANT TO DELETE YOUR ARTIST PORTAL ACCOUNT?')) {
      logout();
      navigate('/artist/register');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-4xl mx-auto flex flex-col gap-6 text-left">
      
      {/* HEADER BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
            ARTIST WORKSPACE // SETTINGS
          </span>
          <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none mt-1">
            ACCOUNT PREFERENCES
          </h1>
          <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase">
            Manage your account notification alerts, booking availability, and security settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-6 py-3 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] hover:bg-[#c2272a] transition-all"
        >
          SAVE PREFERENCES →
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">
          ✓ PREFERENCES SAVED SUCCESSFULLY!
        </div>
      )}

      {/* SETTINGS FORM */}
      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] flex flex-col gap-6">
        <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2">
          NOTIFICATION & PRIVACY PREFERENCES
        </span>

        <div className="flex flex-col gap-3 font-mono text-xs font-bold">
          <label className="flex items-center justify-between p-4 bg-[#ecdcaf] border-2 border-[#191410] cursor-pointer">
            <span>EMAIL NOTIFICATIONS FOR NEW BOOKING INQUIRIES</span>
            <input 
              type="checkbox" 
              checked={settings.bookingAlerts} 
              onChange={(e) => setSettings({ ...settings, bookingAlerts: e.target.checked })}
              className="accent-[#c2272a] w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-[#ecdcaf] border-2 border-[#191410] cursor-pointer">
            <span>EVENT INVITATION ALERTS FROM TANGY CURATORS</span>
            <input 
              type="checkbox" 
              checked={settings.invitationAlerts} 
              onChange={(e) => setSettings({ ...settings, invitationAlerts: e.target.checked })}
              className="accent-[#c2272a] w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-[#ecdcaf] border-2 border-[#191410] cursor-pointer">
            <span>PUBLIC ROSTER PROFILE VISIBILITY</span>
            <input 
              type="checkbox" 
              checked={settings.publicProfile} 
              onChange={(e) => setSettings({ ...settings, publicProfile: e.target.checked })}
              className="accent-[#c2272a] w-5 h-5"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-[#ecdcaf] border-2 border-[#191410] cursor-pointer">
            <span>ACCEPT PRIVATE HERITAGE SESSION REQUESTS</span>
            <input 
              type="checkbox" 
              checked={settings.privateSessions} 
              onChange={(e) => setSettings({ ...settings, privateSessions: e.target.checked })}
              className="accent-[#c2272a] w-5 h-5"
            />
          </label>
        </div>

        {/* DANGER ZONE */}
        <div className="border-t-4 border-[#191410] pt-6 flex flex-col gap-3">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">DANGER ZONE</span>
          <p className="font-mono text-[10px] text-[#241a12]/70">
            Deleting your account will permanently remove your artist profile, uploaded demos, and booking history.
          </p>
          <button
            onClick={handleDelete}
            className="w-fit px-4 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#191410]"
          >
            DELETE ACCOUNT ✕
          </button>
        </div>
      </div>

    </div>
  );
};
