import { useState } from 'react';
import { aiSupportService } from '../../services/aiSupportService';
import { conversationService } from '../../services/conversationService';
import { useUserAuth } from '../../context/UserAuthContext';

const PRIORITIES = ['low', 'normal', 'high'];

// Shown when the conversation can't be created or the message can't be sent.
// The server's own error text is never rendered (it can name tables / RLS).
const SEND_FAILED = "Couldn't reach the Tangy team just now. Please try again, or email hello@tangysessions.com.";

/**
 * Escalation form — "REQUEST AN AGENT" flow. Sends a real message into the
 * real support conversation (conversationService) that the Admin Inbox
 * reads from; priority is kept client-side only for now (no priority column
 * exists on conversations/messages yet).
 *
 * Support conversations belong to an account (conversations.created_by is
 * the signed-in user), so a guest is sent to the existing email-code sign-in
 * instead of calling the RPC; what they typed stays in the form, and once
 * signed in the same button sends it.
 */
export const AgentRequestForm = ({ initialCategory = '', initialQuestion = '', onCancel, onSubmitted }) => {
  const { isLoggedIn, user, loading: authLoading, openLoginModal } = useUserAuth();

  const [category, setCategory] = useState(initialCategory);
  const [question, setQuestion] = useState(initialQuestion);
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const signedIn = isLoggedIn && !!user;

  const categories = aiSupportService.getCategories();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting || authLoading) return;
    setError('');
    if (!signedIn) {
      openLoginModal('TO MESSAGE THE TANGY TEAM');
      return;
    }
    const requester = {
      id: user.id,
      name: user.full_name || user.email || 'Tangy Listener',
      email: user.email,
      role: user.role || 'patron',
    };
    const categoryLabel = categories.find((c) => c.id === category)?.label || category || 'General';
    const combinedQuestion = [question.trim(), description.trim()].filter(Boolean).join(' — ') || 'No details provided.';

    setSubmitting(true);
    let realConversationId;
    try {
      // Creates/reuses the real conversation the Admin Inbox chats through.
      // A retry after a failed send reuses the same open conversation.
      realConversationId = await conversationService.getOrCreateSupportConversation(categoryLabel);
      await conversationService.sendMessage(realConversationId, { text: combinedQuestion });
    } catch (err) {
      console.error('[Tangy] Agent request failed:', err?.message || err);
      setError(SEND_FAILED);
      return;
    } finally {
      setSubmitting(false);
    }
    onSubmitted?.({ conversationId: realConversationId }, requester);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-2 border-[#11100C] bg-[#F5E9C9] text-[#11100C] p-4 shadow-[4px_4px_0px_#11100C] flex flex-col gap-3"
    >
      <div className="flex items-center justify-between border-b-2 border-[#11100C] pb-2">
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase text-[#B94717]">
          ✦ REQUEST AN AGENT
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="font-mono text-[10px] font-bold uppercase text-[#11100C]/60 hover:text-[#5A120D]"
        >
          ✕ CANCEL
        </button>
      </div>

      <p className="font-mono text-[10px] leading-relaxed text-[#11100C]/80">
        Tangy AI is a mock knowledge-base lookup — not a real person. Send this to the Tangy team and someone will pick it up.
      </p>

      <div>
        <label className="block font-mono text-[9px] font-bold tracking-wider uppercase mb-1 text-[#11100C]/70">
          Topic (optional)
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-[#EDE0C0] border-2 border-[#11100C] px-2 py-1.5 font-mono text-xs uppercase focus:outline-none focus:border-[#B94717]"
        >
          <option value="">GENERAL</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-mono text-[9px] font-bold tracking-wider uppercase mb-1 text-[#11100C]/70">
          Your Question
        </label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={2}
          placeholder="What do you need help with?"
          className="w-full bg-[#EDE0C0] border-2 border-[#11100C] px-2 py-1.5 font-serif text-sm focus:outline-none focus:border-[#B94717] resize-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[9px] font-bold tracking-wider uppercase mb-1 text-[#11100C]/70">
          Short Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Any extra detail that helps the team..."
          className="w-full bg-[#EDE0C0] border-2 border-[#11100C] px-2 py-1.5 font-serif text-sm focus:outline-none focus:border-[#B94717] resize-none"
        />
      </div>

      <div>
        <label className="block font-mono text-[9px] font-bold tracking-wider uppercase mb-1 text-[#11100C]/70">
          Priority
        </label>
        <div className="flex gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`flex-1 font-mono text-[10px] font-bold uppercase tracking-wider py-1.5 border-2 border-[#11100C] transition-colors ${
                priority === p ? 'bg-[#11100C] text-[#E7D5A4]' : 'bg-transparent text-[#11100C] hover:bg-[#11100C]/10'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {!signedIn && !authLoading && (
        <p className="font-mono text-[10px] leading-relaxed text-[#11100C]/80 border-l-2 border-[#B94717] pl-2">
          Sign in with your email to send this, so the team can reply to you. What you've typed stays here.
        </p>
      )}

      {error && (
        <p role="alert" className="font-mono text-[10px] font-bold leading-relaxed text-[#F5E9C9] bg-[#B94717] border-2 border-[#11100C] px-2 py-1.5">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || authLoading}
        className="w-full font-mono text-xs font-bold uppercase tracking-widest bg-[#B94717] text-[#F5E9C9] hover:bg-[#11100C] border-2 border-[#11100C] py-2.5 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95 disabled:opacity-50"
      >
        {submitting ? 'SENDING...' : signedIn || authLoading ? 'SEND TO TANGY TEAM →' : 'SIGN IN TO SEND →'}
      </button>
    </form>
  );
};
