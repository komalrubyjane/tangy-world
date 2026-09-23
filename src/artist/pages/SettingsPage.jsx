import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';
import { AgentRequestForm } from '../../components/ai/AgentRequestForm';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { playSFX } = useAudio();
  const [settings, setSettings] = useState({
    bookingAlerts: true,
    invitationAlerts: true,
    publicProfile: true,
    privateSessions: false,
  });
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-8 max-w-4xl mx-auto flex flex-col gap-6 text-left">

      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[10px_10px_0px_#4c1210]">
        <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">ARTIST WORKSPACE // SETTINGS</span>
        <h1 className="font-poster text-4xl sm:text-5xl text-[#191410] leading-none mt-1">ACCOUNT PREFERENCES</h1>
        <p className="font-mono text-xs text-[#241a12]/80 mt-1 uppercase">Signed in as {user?.email}</p>
      </div>

      <div className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[8px_8px_0px_#191410] flex flex-col gap-6">
        <div>
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase border-b-2 border-[#191410] pb-2 block">NOTIFICATION & PRIVACY PREFERENCES</span>
          <p className="font-mono text-[10px] text-[#241a12]/60 normal-case mt-2">
            These preferences aren't wired to a real notification system yet — treat them as a draft, not something that changes what you receive.
          </p>
        </div>

        <div className="flex flex-col gap-3 font-mono text-xs font-bold">
          {[
            ['bookingAlerts', 'EMAIL NOTIFICATIONS FOR NEW BOOKING INQUIRIES'],
            ['invitationAlerts', 'EVENT INVITATION ALERTS FROM TANGY CURATORS'],
            ['publicProfile', 'PUBLIC ROSTER PROFILE VISIBILITY'],
            ['privateSessions', 'ACCEPT PRIVATE HERITAGE SESSION REQUESTS'],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center justify-between p-4 bg-[#ecdcaf] border-2 border-[#191410] cursor-pointer">
              <span>{label}</span>
              <input
                type="checkbox"
                checked={settings[key]}
                onChange={(e) => { playSFX('ticketClick'); setSettings({ ...settings, [key]: e.target.checked }); }}
                className="accent-[#c2272a] w-5 h-5"
              />
            </label>
          ))}
        </div>

        {/* DANGER ZONE — account deletion needs an admin-executed, auditable
            action (deleting an auth user cascades across profiles/bookings/
            media), so this routes to a real support request instead of
            claiming to instantly and irreversibly delete data client-side. */}
        <div className="border-t-4 border-[#191410] pt-6 flex flex-col gap-3">
          <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">DANGER ZONE</span>
          <p className="font-mono text-[10px] text-[#241a12]/70">
            Account deletion is handled by the Tangy team to make sure your bookings, demos and history are wound down correctly.
          </p>
          {deleteRequested ? (
            <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-xs font-bold border-2 border-[#191410] shadow-[4px_4px_0px_#191410]">
              ✓ DELETION REQUEST SENT — THE TEAM WILL FOLLOW UP BY EMAIL.
            </div>
          ) : showDeleteForm ? (
            <AgentRequestForm
              initialCategory="Account"
              initialQuestion="Please delete my artist portal account and associated data."
              onCancel={() => setShowDeleteForm(false)}
              onSubmitted={() => setDeleteRequested(true)}
            />
          ) : (
            <button
              onClick={() => setShowDeleteForm(true)}
              className="w-fit px-4 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#191410]"
            >
              REQUEST ACCOUNT DELETION ✕
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
