import { Link } from 'react-router-dom';
import { timeAgo } from '../../utils/timeAgo';

// One chat bubble, shared by the Admin Inbox, Tangy Assistant (post-escalation),
// and the artist request/chat view — printed-paper style rather than generic
// rounded SaaS bubbles, matching the palette already established in
// TangyAssistant.jsx's original renderBubble (extracted here, not duplicated).
export const MessageBubble = ({ text, isMine, label, sublabel, timestamp, isSystem, cta }) => {
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-wider text-[#C99A2E] bg-[#11100C] border border-[#C99A2E]/40">
          {text}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[88%] sm:max-w-[75%] border-2 px-3 py-2.5 font-serif text-sm leading-relaxed shadow-[3px_3px_0px_#11100C] ${
          isMine ? 'bg-[#E7D5A4] border-[#11100C] text-[#11100C]' : 'bg-[#5A120D] border-[#11100C] text-[#F5E9C9]'
        }`}
      >
        {!isMine && label && (
          <div className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5 text-[#E7D5A4]">
            <span>{label}</span>
            {sublabel && <span className="opacity-60 font-normal normal-case">{sublabel}</span>}
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{text}</p>
        {cta && (
          <Link
            to={cta.to}
            className="inline-block mt-2 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#11100C] text-[#E7D5A4] px-3 py-1.5 hover:bg-[#B94717] transition-colors"
          >
            {cta.label} →
          </Link>
        )}
        {timestamp && (
          <div className={`mt-1 font-mono text-[8.5px] uppercase tracking-wide ${isMine ? 'text-[#11100C]/50' : 'text-[#E7D5A4]/50'}`}>
            {timeAgo(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
};
