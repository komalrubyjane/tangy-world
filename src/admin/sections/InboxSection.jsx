import { useState, useMemo } from 'react';
import { agentService } from '../../services/agentService';
import { messageService } from '../../services/messageService';
import { useUserAuth } from '../../context/UserAuthContext';
import { SearchBar, StatusBadge, EmptyState, ActionButton, DataTable } from '../AdminUI';

const SUBVIEWS = [
  { id: 'all', label: 'ALL' },
  { id: 'unassigned', label: 'UNASSIGNED' },
  { id: 'mine', label: 'ASSIGNED TO ME' },
  { id: 'active', label: 'ACTIVE' },
  { id: 'resolved', label: 'RESOLVED' },
  { id: 'closed', label: 'ARCHIVED' },
];

const PRIORITY_OPTIONS = ['low', 'normal', 'high'];

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const InboxSection = () => {
  const { user } = useUserAuth();
  const adminIdentity = user?.email || user?.full_name || 'Admin';

  const [requests, setRequests] = useState(() => agentService.getAll());
  const [subview, setSubview] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [assignName, setAssignName] = useState(adminIdentity);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);

  const refresh = () => setRequests([...agentService.getAll()]);

  const filtered = useMemo(() => {
    let list = requests;
    if (subview === 'unassigned') list = list.filter((r) => r.status === 'pending' && !r.assignedTo);
    else if (subview === 'mine') list = list.filter((r) => r.assignedTo === adminIdentity);
    else if (subview === 'active') list = list.filter((r) => r.status === 'active');
    else if (subview === 'resolved') list = list.filter((r) => r.status === 'resolved');
    else if (subview === 'closed') list = list.filter((r) => r.status === 'closed');

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.user.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.question.toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, subview, search, adminIdentity]);

  const selected = requests.find((r) => r.id === selectedId) || null;

  const openRequest = (req) => {
    setSelectedId(req.id);
    setNote('');
    setReplyText('');
    setReplySent(false);
    setAssignName(adminIdentity);
  };

  const closeDrawer = () => setSelectedId(null);

  const handleAccept = (id) => {
    agentService.accept(id, adminIdentity);
    refresh();
  };
  const handleAssign = (id) => {
    if (!assignName.trim()) return;
    agentService.assign(id, assignName.trim());
    refresh();
  };
  const handleResolve = (id) => {
    agentService.setStatus(id, 'resolved');
    refresh();
  };
  const handleReopen = (id) => {
    agentService.setStatus(id, 'active');
    refresh();
  };
  const handleArchive = (id) => {
    agentService.setStatus(id, 'closed');
    refresh();
  };
  const handlePriority = (id, priority) => {
    agentService.setPriority(id, priority);
    refresh();
  };

  const handleReply = (req) => {
    if (!replyText.trim()) return;
    messageService.sendTeamMessage(req.conversationId, replyText.trim(), adminIdentity);
    setReplyText('');
    setReplySent(true);
    setTimeout(() => setReplySent(false), 3000);
  };

  return (
    <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
      <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">SUPPORT INBOX</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        {SUBVIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setSubview(v.id)}
            className={`px-3 py-1.5 text-[9px] font-bold uppercase border tracking-wider ${
              subview === v.id
                ? 'bg-[#C99A2E] text-[#11100C] border-[#C99A2E]'
                : 'bg-[#11100C] text-[#E7D5A4]/70 border-[#C99A2E]/30 hover:border-[#C99A2E]'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      <SearchBar value={search} onChange={setSearch} placeholder="Search name, category, question..." count={filtered.length} />

      {filtered.length === 0 ? (
        <EmptyState>NO REQUESTS IN THIS VIEW.</EmptyState>
      ) : (
        <DataTable
          columns={[
            { key: 'user', header: 'NAME', render: (r) => <span className="font-bold">{r.user}</span> },
            { key: 'role', header: 'ROLE', render: (r) => <span className="opacity-70 capitalize">{r.role}</span> },
            { key: 'category', header: 'CATEGORY', render: (r) => <span className="opacity-70">{r.category}</span> },
            { key: 'question', header: 'QUESTION', render: (r) => <span className="block max-w-xs truncate">{r.question}</span> },
            { key: 'priority', header: 'PRIORITY', render: (r) => <StatusBadge status={r.priority} /> },
            { key: 'created', header: 'CREATED', render: (r) => <span className="opacity-60">{timeAgo(r.createdAt)}</span> },
            { key: 'status', header: 'STATUS', render: (r) => <StatusBadge status={r.status} /> },
          ]}
          rows={filtered}
          onRowClick={openRequest}
          renderCard={(r) => (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="font-bold text-sm">{r.user}</div>
                  <div className="text-[10px] opacity-60 capitalize">{r.role} · {r.category}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="text-[10px] opacity-70 line-clamp-2">{r.question}</div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.priority} />
                <span className="text-[10px] opacity-40">{timeAgo(r.createdAt)}</span>
              </div>
            </div>
          )}
        />
      )}

      {selected && (
        <div className="fixed inset-0 z-[300] flex items-center justify-end bg-black/70" onClick={closeDrawer}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-full overflow-y-auto bg-[#191410] border-l-2 border-[#C99A2E] p-6 flex flex-col gap-4 text-[#E7D5A4]"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-[#C99A2E]">{selected.user}</h3>
                <p className="text-[10px] uppercase opacity-60">
                  {selected.role} · {selected.category}
                </p>
              </div>
              <button onClick={closeDrawer} className="text-xl leading-none opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <StatusBadge status={selected.status} />
              <StatusBadge status={selected.priority} />
              <span className="text-[10px] opacity-50">{timeAgo(selected.createdAt)}</span>
            </div>

            <div className="bg-[#11100C] border border-[#C99A2E]/30 p-3 text-xs whitespace-pre-wrap">{selected.question}</div>

            {selected.assignedTo && (
              <p className="text-[10px] uppercase opacity-60">
                Assigned to: <span className="text-[#C99A2E] font-bold">{selected.assignedTo}</span>
              </p>
            )}

            <div>
              <label className="text-[9px] uppercase font-bold text-[#C99A2E] block mb-1">Internal Note (not sent to user)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add a private note for the team..."
                className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <ActionButton tone="success" onClick={() => handleAccept(selected.id)}>
                ACCEPT
              </ActionButton>
              <ActionButton tone="success" onClick={() => handleResolve(selected.id)}>
                RESOLVE
              </ActionButton>
              <ActionButton onClick={() => handleReopen(selected.id)}>REOPEN</ActionButton>
              <ActionButton tone="danger" onClick={() => handleArchive(selected.id)}>
                ARCHIVE
              </ActionButton>
            </div>

            <div className="flex gap-2 items-center">
              <input
                value={assignName}
                onChange={(e) => setAssignName(e.target.value)}
                placeholder="Admin name/email"
                className="flex-1 bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
              />
              <ActionButton onClick={() => handleAssign(selected.id)}>ASSIGN</ActionButton>
            </div>

            <div>
              <label className="text-[9px] uppercase font-bold text-[#C99A2E] block mb-1">Priority</label>
              <select
                value={selected.priority}
                onChange={(e) => handlePriority(selected.id, e.target.value)}
                className="bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 pt-4 border-t border-[#C99A2E]/20">
              <label className="text-[9px] uppercase font-bold text-[#C99A2E] block mb-1">Reply to user</label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={2}
                placeholder="Write a reply..."
                className="w-full bg-[#11100C] border border-[#C99A2E]/60 px-3 py-2 text-xs mb-2"
              />
              <div className="flex items-center gap-2">
                <ActionButton tone="success" onClick={() => handleReply(selected)}>
                  SEND REPLY
                </ActionButton>
                {replySent && <span className="text-[10px] text-[#10b981] font-bold">✓ SENT</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
