import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AgentRequestForm } from '../../components/ai/AgentRequestForm';
import { Panel, Button } from '../../admin/ui';
import { NotificationPreferences, PREF_KEYS_BY_ROLE } from '../../portal/NotificationPreferences';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [deleteRequested, setDeleteRequested] = useState(false);
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  return (
    <div className="w-full p-3 sm:p-6 md:p-8 max-w-4xl mx-auto flex flex-col gap-4 text-left font-sans text-[#E7D5A4]">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#d1a437]">Artist workspace</p>
        <h1 className="font-poster text-3xl sm:text-4xl text-[#ecdcaf] m-0 leading-none">Settings</h1>
        <p className="text-[13px] text-[#ecdcaf]/65 mt-1">Signed in as {user?.email}</p>
      </header>

      <NotificationPreferences keys={PREF_KEYS_BY_ROLE.artist} />

      {/* Account deletion needs an admin-executed, auditable action (deleting
          an auth user cascades across profiles/bookings/media), so this routes
          to a real support request instead of deleting data client-side. */}
      <Panel title="Delete account" subtitle="Handled by the Tangy team so your bookings, media and history are wound down correctly.">
        {deleteRequested ? (
          <p role="status" className="text-[13px] text-[#5fd3a0]">Deletion request sent — the team will follow up by email.</p>
        ) : showDeleteForm ? (
          <AgentRequestForm
            initialCategory="Account"
            initialQuestion="Please delete my artist portal account and associated data."
            onCancel={() => setShowDeleteForm(false)}
            onSubmitted={() => setDeleteRequested(true)}
          />
        ) : (
          <Button variant="danger" onClick={() => setShowDeleteForm(true)}>Request account deletion</Button>
        )}
      </Panel>
    </div>
  );
};
