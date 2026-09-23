import { useState, useEffect, useRef, useMemo } from 'react';
import { useUserAuth } from '../../context/UserAuthContext';
import { conversationService } from '../../services/conversationService';
import { useConversationsInbox } from '../../components/chat/useConversationsInbox';
import { useConversationRealtime } from '../../components/chat/useConversationRealtime';
import { ConversationListItem } from '../../components/chat/ConversationListItem';
import { ChatHeader } from '../../components/chat/ChatHeader';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { MessageComposer } from '../../components/chat/MessageComposer';
import { ROLE_BUCKETS, roleBucket } from '../../utils/roleBucket';
import { EmptyState, ActionButton, Drawer } from '../AdminUI';

const SCOPE_LABELS = {
  all: 'ALL',
  unread: 'UNREAD',
  open: 'OPEN',
  pending: 'PENDING',
  resolved: 'RESOLVED',
  assigned_to_me: 'ASSIGNED TO ME',
  unassigned: 'UNASSIGNED',
};

function InfoPanel({ conversation }) {
  if (!conversation) return null;
  const other = conversation.createdBy;
  return (
    <div className="flex flex-col gap-4 text-[#E7D5A4]">
      <div>
        <div className="w-14 h-14 rounded-full bg-[#5A120D] text-[#E7D5A4] border border-[#C99A2E]/50 flex items-center justify-center font-condensed text-xl mb-2">
          {(other?.name || '?').trim().charAt(0).toUpperCase()}
        </div>
        <h3 className="text-lg font-bold text-[#C99A2E]">{other?.name || 'Guest Visitor'}</h3>
        <p className="text-[10px] font-mono uppercase opacity-60">
          {ROLE_BUCKETS.find((b) => b.id === roleBucket(other?.role))?.label || 'Attendee'}
        </p>
      </div>
      <div className="text-xs flex flex-col gap-1.5 border-t border-[#C99A2E]/20 pt-3">
        {other?.email && (
          <div>
            <span className="opacity-60">Email:</span> {other.email}
          </div>
        )}
        {other?.organization && (
          <div>
            <span className="opacity-60">Organization:</span> {other.organization}
          </div>
        )}
        <div>
          <span className="opacity-60">Conversation:</span> {conversation.category}
        </div>
        <div>
          <span className="opacity-60">Status:</span> {conversation.status}
        </div>
        {conversation.requestedBy && (
          <div>
            <span className="opacity-60">Requested by:</span> {conversation.requestedBy.name}
          </div>
        )}
        {conversation.assignedAdmin && (
          <div>
            <span className="opacity-60">Assigned admin:</span> {conversation.assignedAdmin.name}
          </div>
        )}
        {conversation.relatedSessionId && (
          <div>
            <span className="opacity-60">Related session ID:</span> {conversation.relatedSessionId}
          </div>
        )}
        {conversation.relatedArtistId && (
          <div>
            <span className="opacity-60">Related artist ID:</span> {conversation.relatedArtistId}
          </div>
        )}
      </div>
    </div>
  );
}

export const InboxSection = () => {
  const { user } = useUserAuth();
  const currentAdmin = useMemo(
    () => ({ id: user?.id, name: user?.full_name || user?.email || 'Admin', email: user?.email, role: user?.role }),
    [user]
  );

  const { conversations, loading, error, scope, setScope, scopes, roleFilter, setRoleFilter, search, setSearch, reload } =
    useConversationsInbox({ viewerId: currentAdmin.id });

  const [selectedId, setSelectedId] = useState(null);
  const [mobileView, setMobileView] = useState('list');
  const [infoDrawerOpen, setInfoDrawerOpen] = useState(false);
  const scrollRef = useRef(null);

  const selected = conversations.find((c) => c.id === selectedId) || null;
  const { messages, loading: messagesLoading, sendMessage } = useConversationRealtime(selectedId);

  useEffect(() => {
    if (selectedId) conversationService.markRead(selectedId, currentAdmin.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const openConversation = (c) => {
    setSelectedId(c.id);
    setMobileView('thread');
  };
  const backToList = () => setMobileView('list');

  const withReload = (fn) => async (...args) => {
    await fn(...args);
    reload();
  };
  const handleAssignToMe = withReload(() => conversationService.assignConversation(selected.id, currentAdmin));
  const handleResolve = withReload(() => conversationService.resolveConversation(selected.id));
  const handleReopen = withReload(() => conversationService.reopenConversation(selected.id));
  const handleClose = withReload(() => conversationService.closeConversation(selected.id));

  const handleSend = (text) => sendMessage(text, { sender: currentAdmin });

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 rounded-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 pt-4 pb-3 border-b border-[#C99A2E]/30">
        <h3 className="text-lg font-bold text-[#C99A2E]">INBOX</h3>
        <span className="text-[10px] font-mono uppercase opacity-50">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex h-[78vh] min-h-[540px] max-h-[860px]">
        {/* CONVERSATION LIST */}
        <div className={`${mobileView === 'thread' ? 'hidden' : 'flex'} lg:flex flex-col w-full lg:w-[320px] shrink-0 border-r border-[#C99A2E]/20`}>
          <div className="p-3 border-b border-[#C99A2E]/20 flex flex-col gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, organization..."
              className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs text-[#E7D5A4] focus:outline-none focus:border-[#C99A2E]"
            />
            <div className="flex flex-wrap gap-1.5">
              {scopes.map((s) => (
                <button
                  key={s}
                  onClick={() => setScope(s)}
                  className={`px-2 py-1 text-[8.5px] font-bold uppercase border tracking-wider ${
                    scope === s ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]' : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30 hover:border-[#C99A2E]'
                  }`}
                >
                  {SCOPE_LABELS[s]}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-2 py-1 text-[8.5px] font-bold uppercase border tracking-wider ${
                  roleFilter === 'all' ? 'bg-[#E7D5A4] text-[#11100C] border-[#E7D5A4]' : 'bg-[#11100C] text-[#E7D5A4]/60 border-[#E7D5A4]/20 hover:border-[#E7D5A4]/60'
                }`}
              >
                ALL ROLES
              </button>
              {ROLE_BUCKETS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setRoleFilter(b.id)}
                  className={`px-2 py-1 text-[8.5px] font-bold uppercase border tracking-wider ${
                    roleFilter === b.id ? 'bg-[#E7D5A4] text-[#11100C] border-[#E7D5A4]' : 'bg-[#11100C] text-[#E7D5A4]/60 border-[#E7D5A4]/20 hover:border-[#E7D5A4]/60'
                  }`}
                >
                  {b.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING...</div>
            ) : error ? (
              <div className="p-6 text-center font-mono text-xs text-[#ef4444]">{error}</div>
            ) : conversations.length === 0 ? (
              <EmptyState>NO CONVERSATIONS IN THIS VIEW.</EmptyState>
            ) : (
              conversations.map((c) => (
                <ConversationListItem key={c.id} conversation={c} active={c.id === selectedId} onClick={() => openConversation(c)} />
              ))
            )}
          </div>
        </div>

        {/* CHAT THREAD */}
        <div className={`${mobileView === 'list' ? 'hidden' : 'flex'} lg:flex flex-1 flex-col min-w-0`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-[#E7D5A4]/40 font-mono text-xs uppercase">
              Select a conversation to start chatting
            </div>
          ) : (
            <>
              <ChatHeader
                title={selected.createdBy?.name || 'Guest Visitor'}
                subtitle={`${ROLE_BUCKETS.find((b) => b.id === roleBucket(selected.createdBy?.role))?.label || 'Attendee'} · ${selected.category}`}
                status={selected.status}
                onBack={mobileView === 'thread' ? backToList : undefined}
                actions={
                  <>
                    <button
                      onClick={() => setInfoDrawerOpen(true)}
                      className="xl:hidden px-2 py-1.5 text-[9px] font-bold uppercase border border-[#C99A2E]/40 text-[#E7D5A4] hover:border-[#C99A2E]"
                    >
                      INFO
                    </button>
                    {!selected.assignedAdmin && <ActionButton tone="success" onClick={handleAssignToMe}>ASSIGN TO ME</ActionButton>}
                    {selected.status !== 'resolved' && <ActionButton tone="success" onClick={handleResolve}>RESOLVE</ActionButton>}
                    {selected.status !== 'open' && <ActionButton onClick={handleReopen}>REOPEN</ActionButton>}
                    {selected.status !== 'closed' && <ActionButton tone="danger" onClick={handleClose}>CLOSE</ActionButton>}
                  </>
                }
              />
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 bg-[#191410]" style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}>
                {messagesLoading ? (
                  <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING MESSAGES...</div>
                ) : messages.length === 0 ? (
                  <EmptyState>NO MESSAGES YET — SEND THE FIRST ONE.</EmptyState>
                ) : (
                  messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      text={m.text}
                      isMine={m.senderId === currentAdmin.id}
                      isSystem={m.messageType === 'system'}
                      label={m.senderId === selected.createdBy?.id ? selected.createdBy?.name : 'TANGY TEAM'}
                      timestamp={m.timestamp}
                    />
                  ))
                )}
              </div>
              <MessageComposer onSend={handleSend} placeholder="Reply to this conversation..." disabled={selected.status === 'closed'} />
            </>
          )}
        </div>

        {/* INFO PANEL — desktop */}
        {selected && (
          <div className="hidden xl:flex xl:w-72 shrink-0 border-l border-[#C99A2E]/20 p-5 overflow-y-auto">
            <InfoPanel conversation={selected} />
          </div>
        )}
      </div>

      {infoDrawerOpen && selected && (
        <Drawer onClose={() => setInfoDrawerOpen(false)}>
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-[#C99A2E]">CONVERSATION INFO</h3>
            <button onClick={() => setInfoDrawerOpen(false)} className="text-xl leading-none opacity-70 hover:opacity-100">✕</button>
          </div>
          <InfoPanel conversation={selected} />
        </Drawer>
      )}
    </div>
  );
};
