import { StatusBadge } from '../../admin/AdminUI';
import { timeAgo } from '../../utils/timeAgo';
import { roleBucket, ROLE_BUCKETS } from '../../utils/roleBucket';

const ROLE_LABEL = Object.fromEntries(ROLE_BUCKETS.map((b) => [b.id, b.label]));

// One row in the WhatsApp/IG-DM-style conversation list — avatar initial,
// name, role, last message preview, time, unread dot, status chip.
export const ConversationListItem = ({ conversation, active, onClick }) => {
  const other = conversation.createdBy;
  const initial = (other?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 px-3 py-3 border-b border-[#C99A2E]/15 transition-colors ${
        active ? 'bg-[#C99A2E]/15' : 'hover:bg-[#C99A2E]/5'
      }`}
    >
      <div className="shrink-0 w-9 h-9 rounded-full bg-[#5A120D] text-[#E7D5A4] border border-[#C99A2E]/50 flex items-center justify-center font-display text-sm">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`truncate text-sm ${conversation.unread ? 'font-bold text-[#E7D5A4]' : 'font-semibold text-[#E7D5A4]/85'}`}>
            {other?.name || 'Guest Visitor'}
          </span>
          <span className="shrink-0 text-[9px] font-mono opacity-50">{timeAgo(conversation.lastMessageAt || conversation.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {other?.role && <span className="text-[9px] font-mono uppercase opacity-50">{ROLE_LABEL[roleBucket(other.role)]}</span>}
        </div>
        <p className={`text-xs mt-1 truncate ${conversation.unread ? 'text-[#E7D5A4]/90 font-medium' : 'text-[#E7D5A4]/50'}`}>
          {conversation.lastMessagePreview || 'No messages yet'}
        </p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <StatusBadge status={conversation.status} />
          {conversation.assignedAdmin && (
            <span className="text-[8.5px] font-mono uppercase opacity-50 truncate">→ {conversation.assignedAdmin.name}</span>
          )}
        </div>
      </div>
      {conversation.unread && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#B94717] mt-1.5" aria-label="Unread" />}
    </button>
  );
};
