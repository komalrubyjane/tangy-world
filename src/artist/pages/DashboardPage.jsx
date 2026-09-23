import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';
import { assignmentService } from '../../services/assignmentService';
import { supabase } from '../../lib/supabaseClient';
import { useConversationRealtime } from '../../components/chat/useConversationRealtime';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageComposer } from '../../components/chat/MessageComposer';

// Inline expandable thread — reuses the same conversation architecture as
// the Admin Inbox and Tangy Assistant rather than a separate mini chat.
function InviteChatThread({ conversationId, artistUser }) {
  const { messages, loading, sendMessage } = useConversationRealtime(conversationId);
  const handleSend = (text) => sendMessage(text, { sender: { id: artistUser.userId, name: artistUser.name, role: 'artist' } });

  return (
    <div className="mt-3 border-t-2 border-[#191410]/20 pt-3">
      <div className="max-h-56 overflow-y-auto flex flex-col gap-1 mb-2 px-0.5">
        {loading ? (
          <div className="text-[10px] font-mono opacity-50 text-center py-2">LOADING...</div>
        ) : messages.length === 0 ? (
          <div className="text-[10px] font-mono opacity-50 text-center py-2">NO MESSAGES YET.</div>
        ) : (
          messages.map((m) => (
            <MessageBubble
              key={m.id}
              text={m.text}
              isMine={m.senderId === artistUser.userId}
              isSystem={m.messageType === 'system'}
              label={m.senderId === artistUser.userId ? undefined : 'ADMIN'}
              timestamp={m.timestamp}
            />
          ))
        )}
      </div>
      <MessageComposer onSend={handleSend} placeholder="Message the admin..." />
    </div>
  );
}

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSFX } = useAudio();

  const quickActions = [
    { label: 'UPDATE BIO', icon: '✍', path: '/artist/profile' },
    { label: 'AVAILABILITY', icon: '📅', path: '/artist/calendar' },
    { label: 'UPLOAD MEDIA', icon: '🎵', path: '/artist/media' },
    { label: 'SETTINGS', icon: '⚙️', path: '/artist/settings' },
  ];

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [openChatId, setOpenChatId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [respondingId, setRespondingId] = useState(null);
  const [performances, setPerformances] = useState([]);
  const [loadingPerformances, setLoadingPerformances] = useState(true);

  const loadRequests = () => {
    if (!user?.id) return;
    setLoadingRequests(true);
    assignmentService
      .listForArtist(user.id)
      .then(setRequests)
      .catch((err) => setActionError(err?.message || 'Failed to load assignment requests.'))
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    setLoadingPerformances(true);
    supabase
      .from('event_artists')
      .select('events(name, event_date, event_time, venue, status)')
      .eq('artist_id', user.id)
      .then(({ data }) => setPerformances((data || []).map((r) => r.events).filter(Boolean)))
      .finally(() => setLoadingPerformances(false));
  }, [user?.id]);

  const today = new Date().toISOString().slice(0, 10);
  const upcomingShows = performances
    .filter((e) => e.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const totalShows = performances.length;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const respondedRequests = requests.filter((r) => r.status !== 'pending');
  const recentActivity = respondedRequests
    .filter((r) => r.respondedAt)
    .sort((a, b) => new Date(b.respondedAt) - new Date(a.respondedAt))
    .slice(0, 5);

  const handleRespond = async (id, accept) => {
    setActionError('');
    setRespondingId(id);
    try {
      await assignmentService.respond(id, accept);
      loadRequests();
    } catch (err) {
      setActionError(err?.message || 'Could not send your response — try again.');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-50px)] p-3 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-8 text-left overflow-x-hidden">

      {/* HEADER BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-8 shadow-[6px_6px_0px_#4c1210] sm:shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-full">
        <div>
          <span className="font-mono text-[8.5px] sm:text-[9px] font-bold text-[#c2272a] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
            ARTIST WORKSPACE // CONTROL CENTER
          </span>
          <h1 className="font-poster text-3xl sm:text-5xl text-[#191410] leading-none mt-1">
            WELCOME BACK, <span className="text-[#c2272a]">{user?.name || 'ARTIST'}</span>
          </h1>
          <p className="font-mono text-[10.5px] sm:text-xs text-[#241a12]/80 mt-1 uppercase">
            {user?.genre || 'Techno / Deep House'} · {user?.city || 'Hyderabad'}
          </p>
        </div>

        <button
          onClick={() => { playSFX('ticketClick'); navigate('/artist/profile'); }}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] hover:bg-[#c2272a] transition-all min-h-[44px] text-center"
        >
          EDIT PROFILE →
        </button>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">UPCOMING SHOWS</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#c2272a] leading-none my-0.5 sm:my-1">{loadingPerformances ? '—' : upcomingShows.length}</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">{upcomingShows[0] ? `NEXT: ${upcomingShows[0].event_date}` : 'NONE SCHEDULED'}</span>
        </div>

        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">PROFILE COMPLETE</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#2e6834] leading-none my-0.5 sm:my-1">{user?.profileComplete || 85}%</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">HIGH QUALITY PROFILE</span>
        </div>

        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">PENDING REQUESTS</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#c2272a] leading-none my-0.5 sm:my-1">{pendingRequests.length}</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">{pendingRequests.length ? 'ACTION REQUIRED' : 'ALL CLEAR'}</span>
        </div>

        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">TOTAL SHOWS</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#191410] leading-none my-0.5 sm:my-1">{loadingPerformances ? '—' : totalShows}</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">ON RECORD</span>
        </div>
      </div>

      {/* MAIN TWO COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">

        {/* LEFT TWO COLUMNS: SHOWS & ASSIGNMENT REQUESTS */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">

          {/* UPCOMING PERFORMANCES */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <div className="flex justify-between items-center border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">UPCOMING PERFORMANCES</span>
              <button
                onClick={() => navigate('/artist/calendar')}
                className="font-mono text-[9.5px] sm:text-[10px] font-bold text-[#191410] underline uppercase"
              >
                VIEW CALENDAR →
              </button>
            </div>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              {loadingPerformances ? (
                <div className="text-center font-mono text-[10px] opacity-50 py-4">LOADING...</div>
              ) : upcomingShows.length === 0 ? (
                <div className="text-center font-mono text-[10px] opacity-50 py-4">NO UPCOMING PERFORMANCES CONFIRMED YET.</div>
              ) : upcomingShows.map((s) => (
                <div key={s.name + s.event_date} className="p-3 sm:p-4 bg-[#ecdcaf] border-2 border-[#191410] flex justify-between items-center gap-3">
                  <div>
                    <h3 className="font-poster text-lg sm:text-xl text-[#191410] leading-tight">{s.name}</h3>
                    <p className="font-mono text-[9.5px] sm:text-[10px] text-[#241a12]/80 uppercase">{s.venue} · {s.event_time}</p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-bold text-[#c2272a]">{s.event_date}</span>
                    <span className={`px-2 py-0.5 font-mono text-[8.5px] sm:text-[9px] font-bold uppercase border border-[#191410] ${s.status === 'on-sale' ? 'bg-[#2e6834] text-[#ecdcaf]' : 'bg-[#d1a437] text-[#191410]'}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SESSION ASSIGNMENT REQUESTS */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              SESSION ASSIGNMENT REQUESTS
            </span>

            {actionError && (
              <div className="mb-3 px-3 py-2 bg-[#c2272a]/15 border border-[#c2272a]/50 text-[#c2272a] font-mono text-[10px]">{actionError}</div>
            )}

            {loadingRequests ? (
              <div className="text-center font-mono text-[10px] opacity-50 py-4">LOADING...</div>
            ) : requests.length === 0 ? (
              <div className="text-center font-mono text-[10px] opacity-50 py-4">NO ASSIGNMENT REQUESTS YET.</div>
            ) : (
              <div className="flex flex-col gap-3">
                {[...pendingRequests, ...respondedRequests].map((req) => (
                  <div key={req.id} className="p-3.5 sm:p-4 bg-[#191410] text-[#ecdcaf] border-2 border-[#191410]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-poster text-xl sm:text-2xl text-[#ecdcaf]">{req.sessionName || 'Session'}</h3>
                        {req.message && <p className="font-mono text-[9.5px] sm:text-[10px] text-[#ecdcaf]/80 mt-0.5">{req.message}</p>}
                        <span className={`inline-block mt-1.5 px-2 py-0.5 font-mono text-[8.5px] font-bold uppercase border ${
                          req.status === 'accepted' ? 'bg-[#2e6834] text-[#ecdcaf] border-[#2e6834]'
                          : req.status === 'declined' ? 'bg-[#c2272a] text-[#ecdcaf] border-[#c2272a]'
                          : req.status === 'cancelled' ? 'bg-transparent text-[#ecdcaf]/50 border-[#ecdcaf]/30'
                          : 'bg-[#d1a437] text-[#191410] border-[#d1a437]'
                        }`}>
                          {req.status}
                        </span>
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            disabled={respondingId === req.id}
                            onClick={() => handleRespond(req.id, true)}
                            className="flex-1 sm:flex-initial px-3 py-2 bg-[#2e6834] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410] uppercase text-center min-h-[38px] disabled:opacity-50"
                          >
                            ACCEPT
                          </button>
                          <button
                            disabled={respondingId === req.id}
                            onClick={() => handleRespond(req.id, false)}
                            className="flex-1 sm:flex-initial px-3 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410] uppercase text-center min-h-[38px] disabled:opacity-50"
                          >
                            DECLINE
                          </button>
                        </div>
                      )}
                    </div>

                    {req.conversationId && (
                      <button
                        type="button"
                        onClick={() => setOpenChatId(openChatId === req.id ? null : req.id)}
                        className="mt-2 font-mono text-[9px] font-bold uppercase tracking-widest text-[#d1a437] underline"
                      >
                        {openChatId === req.id ? 'HIDE CONVERSATION ▲' : 'MESSAGE ADMIN ▼'}
                      </button>
                    )}
                    {openChatId === req.id && req.conversationId && (
                      <InviteChatThread conversationId={req.conversationId} artistUser={user} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS & RECENT ACTIVITY */}
        <div className="flex flex-col gap-4 sm:gap-6">

          {/* QUICK ACTIONS GRID */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              QUICK ACTIONS
            </span>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {quickActions.map((qa, idx) => (
                <button
                  key={idx}
                  onClick={() => { playSFX('ticketClick'); navigate(qa.path); }}
                  className="p-3 sm:p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col items-center gap-1 font-mono text-[9.5px] sm:text-[10px] font-bold text-[#191410] hover:bg-[#c2272a] hover:text-[#ecdcaf] transition-all shadow-[2px_2px_0px_#191410] sm:shadow-[3px_3px_0px_#191410] active:scale-95 min-h-[64px] justify-center"
                >
                  <span className="text-lg sm:text-xl">{qa.icon}</span>
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY STREAM */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              RECENT ACTIVITY
            </span>

            <div className="flex flex-col gap-2 font-mono text-[9.5px] sm:text-[10px]">
              {recentActivity.length === 0 ? (
                <div className="text-center opacity-50 py-2">NO ACTIVITY YET.</div>
              ) : recentActivity.map((req) => (
                <div key={req.id} className="border-b border-[#191410]/20 pb-2">
                  <p className="text-[#241a12] font-bold">
                    {req.status === 'accepted' ? 'Accepted' : req.status === 'declined' ? 'Declined' : req.status} assignment for {req.sessionName || 'a session'}
                  </p>
                  <span className="text-[#c2272a] text-[8px] sm:text-[8.5px]">{new Date(req.respondedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
