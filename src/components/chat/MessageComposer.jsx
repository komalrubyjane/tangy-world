import { useState } from 'react';

// Shared composer — Enter sends, Shift+Enter inserts a newline, disabled +
// spinner while sending, inline error on failure. Used by the Admin Inbox,
// Tangy Assistant (post-escalation), and the artist chat view.
export const MessageComposer = ({ onSend, placeholder = 'Type a message...', disabled = false }) => {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const value = text.trim();
    if (!value || sending || disabled) return;
    setSending(true);
    setError('');
    try {
      await onSend(value);
      setText('');
    } catch (err) {
      setError(err?.message || 'Message failed to send — try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t-4 border-[#C99A2E] bg-[#1A140F] p-3">
      {error && (
        <div className="mb-2 px-2 py-1.5 bg-[#ef4444]/15 border border-[#ef4444]/40 text-[#ef4444] font-mono text-[10px]">
          {error}
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
          aria-label="Message"
          className="flex-1 min-w-0 resize-none max-h-32 bg-[#F5E9C9] border-2 border-[#11100C] px-3 py-2 font-serif text-sm text-[#11100C] focus:outline-none focus:border-[#B94717] disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!text.trim() || sending || disabled}
          className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#B94717] text-[#F5E9C9] hover:bg-[#C99A2E] hover:text-[#11100C] border-2 border-[#11100C] px-4 py-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? '...' : 'SEND'}
        </button>
      </div>
    </div>
  );
};
