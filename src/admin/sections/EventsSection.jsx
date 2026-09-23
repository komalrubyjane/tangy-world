import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAdminList } from '../useAdminList';
import { assignmentService } from '../../services/assignmentService';
import { useUserAuth } from '../../context/UserAuthContext';
import { SearchBar, StatusBadge, LoadMoreButton, EmptyState, NotConfiguredState, ActionButton, Modal } from '../AdminUI';

const STATUS_OPTIONS = ['draft', 'on-sale', 'sold-out', 'past', 'cancelled'];

// Admin -> artist session assignment: pick an approved artist not already
// confirmed for this session, send a request, track its status.
function AssignArtistModal({ event, onClose }) {
  const { user } = useUserAuth();
  const currentAdmin = { id: user?.id, name: user?.full_name || user?.email || 'Admin', email: user?.email, role: user?.role };

  const [artists, setArtists] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const sessionId = event.id;
  const sessionName = event.name;

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase.from('artists').select('id, name, email, user_id').eq('status', 'approved');
      if (err) throw new Error(err.message);
      setArtists(data || []);
      const { data: links } = await supabase.from('event_artists').select('artist_id').eq('event_id', event.id);
      setConfirmedIds((links || []).map((l) => l.artist_id));
      const existing = await assignmentService.listForSession(sessionId);
      setRequests(existing);
    } catch (err) {
      setError(err?.message || 'Failed to load artists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestByArtist = Object.fromEntries(requests.map((r) => [r.artistId, r]));
  const availableArtists = artists.filter((a) => !confirmedIds.includes(a.id));

  const handleSend = async () => {
    if (!selectedArtistId) return;
    setSending(true);
    setError('');
    try {
      const artist = artists.find((a) => a.id === selectedArtistId);
      await assignmentService.createRequest({
        sessionId,
        sessionName,
        artist: { id: artist.id, userId: artist.userId || artist.user_id, name: artist.name, email: artist.email },
        admin: currentAdmin,
        message: message.trim() || null,
      });
      setMessage('');
      setSelectedArtistId('');
      await load();
    } catch (err) {
      setError(err?.message || 'Could not send the request.');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (requestId) => {
    await assignmentService.cancel(requestId);
    load();
  };

  return (
    <Modal onClose={onClose} wide>
      <h3 className="text-lg font-bold text-[#C99A2E] mb-1">ASSIGN ARTIST — {sessionName}</h3>
      <p className="text-[10px] font-mono uppercase opacity-60 mb-3">Sends a request the artist must accept before the assignment is confirmed.</p>
      {error && <div className="p-2 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 text-xs mb-2">{error}</div>}
      {loading ? (
        <div className="p-6 text-center font-mono text-xs opacity-50">LOADING...</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <select
              value={selectedArtistId}
              onChange={(e) => setSelectedArtistId(e.target.value)}
              className="flex-1 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
            >
              <option value="">Select an approved artist...</option>
              {availableArtists.map((a) => (
                <option key={a.id} value={a.id} disabled={requestByArtist[a.id]?.status === 'pending'}>
                  {a.name}{requestByArtist[a.id] ? ` — ${requestByArtist[a.id].status}` : ''}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            placeholder="Optional note to the artist..."
            className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs mb-3"
          />
          <button
            onClick={handleSend}
            disabled={!selectedArtistId || sending}
            className="w-full py-2.5 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase disabled:opacity-50 mb-4"
          >
            {sending ? 'SENDING...' : 'SEND REQUEST'}
          </button>

          {requests.length > 0 && (
            <div className="border-t border-[#C99A2E]/20 pt-3">
              <h4 className="text-[10px] font-bold uppercase text-[#C99A2E] mb-2">Requests for this session</h4>
              <div className="flex flex-col gap-1.5">
                {requests.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 text-xs bg-[#11100C] border border-[#C99A2E]/20 px-3 py-2">
                    <span>{r.artistName}</span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {r.status === 'pending' && (
                        <button onClick={() => handleCancel(r.id)} className="text-[9px] font-bold uppercase text-[#ef4444] underline">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

const ASSIGNEE_ROLES = ['crew', 'volunteer', 'vendor'];
const ASSIGNEE_PROFILE_TABLE = { crew: 'crew_profiles', volunteer: 'volunteer_profiles', vendor: 'vendor_profiles' };

// Admin staffs an event with an approved crew/volunteer/vendor account —
// writes to the shared event_assignments table (0011_role_portals.sql).
// Tasks are added per-assignment once it exists.
function StaffEventModal({ event, onClose }) {
  const { user } = useUserAuth();
  const [roleTab, setRoleTab] = useState('crew');
  const [candidates, setCandidates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [title, setTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [taskDrafts, setTaskDrafts] = useState({}); // assignmentId -> title

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: profRows } = await supabase
        .from(ASSIGNEE_PROFILE_TABLE[roleTab])
        .select('id, profiles(full_name, email)');
      setCandidates((profRows || []).map((r) => ({ id: r.id, name: r.profiles?.full_name || r.profiles?.email || r.id })));

      const { data: assignRows } = await supabase
        .from('event_assignments')
        .select('*, profiles(full_name, email), event_tasks(id, title, status)')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });
      setAssignments(assignRows || []);
    } catch (err) {
      setError(err?.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleTab]);

  const handleAssign = async () => {
    if (!selectedId || !title.trim()) return;
    setSending(true);
    setError('');
    const { error: err } = await supabase.from('event_assignments').insert({
      event_id: event.id,
      assignee_role: roleTab,
      assignee_id: selectedId,
      title: title.trim(),
      assigned_by: user.id,
    });
    setSending(false);
    if (err) { setError(err.message); return; }
    setSelectedId('');
    setTitle('');
    load();
  };

  const addTask = async (assignmentId) => {
    const draft = (taskDrafts[assignmentId] || '').trim();
    if (!draft) return;
    await supabase.from('event_tasks').insert({ assignment_id: assignmentId, title: draft });
    setTaskDrafts((d) => ({ ...d, [assignmentId]: '' }));
    load();
  };

  const roleAssignments = assignments.filter((a) => a.assignee_role === roleTab);

  return (
    <Modal onClose={onClose} wide>
      <h3 className="text-lg font-bold text-[#C99A2E] mb-1">STAFF EVENT — {event.name}</h3>
      <p className="text-[10px] font-mono uppercase opacity-60 mb-3">Assign approved crew, volunteers or vendors to work this session.</p>

      <div className="flex gap-2 mb-3">
        {ASSIGNEE_ROLES.map((r) => (
          <button key={r} onClick={() => setRoleTab(r)} className={`px-3 py-1.5 text-[9px] font-bold uppercase border ${roleTab === r ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30'}`}>
            {r}
          </button>
        ))}
      </div>

      {error && <div className="p-2 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 text-xs mb-2">{error}</div>}

      {loading ? (
        <div className="p-6 text-center font-mono text-xs opacity-50">LOADING...</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-2 mb-2">
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="flex-1 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
              <option value="">Select an approved {roleTab}...</option>
              {candidates.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role title (e.g. Sound, Front of House)" className="flex-1 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
          </div>
          <button onClick={handleAssign} disabled={!selectedId || !title.trim() || sending} className="w-full py-2.5 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase disabled:opacity-50 mb-4">
            {sending ? 'ASSIGNING...' : 'ASSIGN'}
          </button>

          {candidates.length === 0 && <p className="text-[10px] opacity-50 mb-4">No approved {roleTab} accounts yet — approve an application first.</p>}

          {roleAssignments.length > 0 && (
            <div className="border-t border-[#C99A2E]/20 pt-3 flex flex-col gap-3">
              <h4 className="text-[10px] font-bold uppercase text-[#C99A2E]">Assigned</h4>
              {roleAssignments.map((a) => (
                <div key={a.id} className="bg-[#11100C] border border-[#C99A2E]/20 p-3">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span>{a.profiles?.full_name || a.profiles?.email} — <span className="opacity-70">{a.title}</span></span>
                    <StatusBadge status={a.status} />
                  </div>
                  {roleTab === 'crew' && (
                    <div className="mt-2 pt-2 border-t border-[#C99A2E]/10">
                      {a.event_tasks?.length > 0 && (
                        <ul className="flex flex-col gap-1 mb-2">
                          {a.event_tasks.map((t) => (
                            <li key={t.id} className="flex items-center justify-between text-[10px]">
                              <span className="opacity-80">{t.title}</span>
                              <StatusBadge status={t.status === 'done' ? 'confirmed' : t.status === 'in_progress' ? 'scheduled' : 'pending'} />
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-1.5">
                        <input
                          value={taskDrafts[a.id] || ''}
                          onChange={(e) => setTaskDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                          placeholder="Add a task..."
                          className="flex-1 bg-[#191410] border border-[#C99A2E]/40 px-2 py-1.5 text-[10px]"
                        />
                        <button onClick={() => addTask(a.id)} className="px-2.5 py-1.5 bg-[#C99A2E]/20 text-[#C99A2E] text-[9px] font-bold uppercase border border-[#C99A2E]/40">ADD</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function slugify(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function EventFormModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial || { slug: '', name: '', description: '', event_date: '', event_time: '', venue: '', image_url: '', capacity: 100, price: 799, status: 'draft', featured: false, venue_partner_id: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [venuePartners, setVenuePartners] = useState([]);
  const isEdit = Boolean(initial?.id);

  useEffect(() => {
    supabase.from('venue_profiles').select('id, property_name, profiles(full_name, email)').then(({ data }) => {
      setVenuePartners((data || []).map((v) => ({ id: v.id, name: v.property_name || v.profiles?.full_name || v.profiles?.email || v.id })));
    });
  }, []);

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      capacity: parseInt(form.capacity, 10) || 0,
      price: parseInt(form.price, 10) || 0,
      venue_partner_id: form.venue_partner_id || null,
    };
    delete payload.id;
    delete payload.created_at;

    const result = isEdit
      ? await supabase.from('events').update(payload).eq('id', initial.id)
      : await supabase.from('events').insert(payload);

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80">
      <form onSubmit={handleSave} className="w-full max-w-lg max-h-[90dvh] overflow-y-auto bg-[#191410] border-2 border-[#C99A2E] p-6 flex flex-col gap-3 text-[#E7D5A4]">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-2">{isEdit ? 'EDIT EVENT' : 'CREATE EVENT'}</h3>
        <input required placeholder="Event name" value={form.name} onChange={set('name')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <input placeholder="Slug (auto if blank)" value={form.slug} onChange={set('slug')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <textarea placeholder="Description" rows={3} value={form.description} onChange={set('description')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="date" value={form.event_date} onChange={set('event_date')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
          <input placeholder="Time (e.g. 7:00 PM)" value={form.event_time} onChange={set('event_time')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        </div>
        <input placeholder="Venue" value={form.venue} onChange={set('venue')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <select value={form.venue_partner_id || ''} onChange={set('venue_partner_id')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
          <option value="">No venue partner account linked</option>
          {venuePartners.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input placeholder="Image URL (/media/gallery/...)" value={form.image_url} onChange={set('image_url')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="number" min="0" placeholder="Capacity" value={form.capacity} onChange={set('capacity')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
          <input required type="number" min="0" placeholder="Price (₹)" value={form.price} onChange={set('price')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs" />
        </div>
        <div className="grid grid-cols-2 gap-3 items-center">
          <select value={form.status} onChange={set('status')} className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured
          </label>
        </div>
        {error && <div className="p-2 bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/40 text-xs">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-[#C99A2E]/40 text-xs uppercase">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 py-2 bg-[#C99A2E] text-[#11100C] font-bold text-xs uppercase disabled:opacity-50">
            {saving ? 'SAVING...' : isEdit ? 'SAVE CHANGES' : 'CREATE EVENT'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const EventsSection = () => {
  const { rows, total, loading, error, search, setSearch, hasMore, loadMore, reload } = useAdminList('events', {
    searchFields: ['name', 'venue', 'status'],
  });
  const [modalEvent, setModalEvent] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [assignEvent, setAssignEvent] = useState(null);
  const [staffEvent, setStaffEvent] = useState(null);

  const handleDelete = async (id) => {
    await supabase.from('events').delete().eq('id', id);
    setConfirmDeleteId(null);
    reload();
  };

  const toggleFeatured = async (evt) => {
    await supabase.from('events').update({ featured: !evt.featured }).eq('id', evt.id);
    reload();
  };

  if (error === 'not-configured') return <NotConfiguredState />;

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <div className="flex justify-between items-center border-b border-[#C99A2E]/30 pb-2 mb-4">
        <h3 className="text-lg font-bold text-[#C99A2E]">EVENTS &amp; SESSIONS MANAGEMENT</h3>
        <button onClick={() => setModalEvent({})} className="px-3 py-1.5 bg-[#C99A2E] text-[#11100C] text-[10px] font-bold uppercase">+ NEW EVENT</button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Search name, venue, status..." count={total} />
      {loading ? <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div> : rows.length === 0 ? (
        <EmptyState>NO EVENTS YET — CREATE ONE ABOVE.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.map((evt) => (
            <div key={evt.id} className="bg-[#11100C] border border-[#C99A2E]/40 p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <div className="text-[10px] text-[#C99A2E] font-bold">{evt.event_date}</div>
                  {evt.featured && <span className="text-[8px] bg-[#C99A2E] text-[#11100C] px-1.5 py-0.5 font-bold">FEATURED</span>}
                </div>
                <h4 className="font-display text-xl font-bold text-[#E7D5A4] mt-1">{evt.name}</h4>
                <div className="text-xs opacity-70 mt-1">{evt.venue}</div>
                <div className="mt-3 text-xs space-y-1">
                  <div>Cap: <span className="font-bold">{evt.capacity}</span></div>
                  <div>Price: <span className="font-bold text-[#C99A2E]">₹{evt.price}</span></div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#C99A2E]/20 flex flex-col gap-2">
                <StatusBadge status={evt.status} />
                <div className="flex gap-1.5 flex-wrap">
                  <ActionButton onClick={() => setModalEvent(evt)}>EDIT</ActionButton>
                  <ActionButton onClick={() => toggleFeatured(evt)}>{evt.featured ? 'UNFEATURE' : 'FEATURE'}</ActionButton>
                  <ActionButton onClick={() => setAssignEvent(evt)}>ASSIGN ARTIST</ActionButton>
                  <ActionButton onClick={() => setStaffEvent(evt)}>STAFF EVENT</ActionButton>
                  {confirmDeleteId === evt.id ? (
                    <>
                      <ActionButton tone="danger" onClick={() => handleDelete(evt.id)}>CONFIRM DELETE</ActionButton>
                      <ActionButton onClick={() => setConfirmDeleteId(null)}>CANCEL</ActionButton>
                    </>
                  ) : (
                    <ActionButton tone="danger" onClick={() => setConfirmDeleteId(evt.id)}>DELETE</ActionButton>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <LoadMoreButton hasMore={hasMore} onClick={loadMore} />
      {modalEvent && (
        <EventFormModal initial={modalEvent} onClose={() => setModalEvent(null)} onSaved={() => { setModalEvent(null); reload(); }} />
      )}
      {assignEvent && (
        <AssignArtistModal event={assignEvent} onClose={() => { setAssignEvent(null); reload(); }} />
      )}
      {staffEvent && (
        <StaffEventModal event={staffEvent} onClose={() => setStaffEvent(null)} />
      )}
    </div>
  );
};
