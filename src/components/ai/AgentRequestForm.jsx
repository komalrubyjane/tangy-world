import { useState } from 'react';
import { aiSupportService } from '../../services/aiSupportService';
import { conversationService } from '../../services/conversationService';
import { useUserAuth } from '../../context/UserAuthContext';

const PRIORITIES = ['low', 'normal', 'high'];

/**
 * Escalation form — "REQUEST AN AGENT" flow. Sends a real message into the
 * real support conversation (conversationService) that the Admin Inbox
 * reads from; priority is kept client-side only for now (no priority column
 * exists on conversations/messages yet).
 */
export const AgentRequestForm = ({ conversationId, initialCategory = '', initialQuestion = '', onCancel, onSubmitted }) => {
  const { isLoggedIn: realLoggedIn, user: realUser } = useUserAuth();

  const [category, setCategory] = useState(initialCategory);
  const [question, setQuestion] = useState(initialQuestion);
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = aiSupportService.getCategories();

  const resolveRequester = () => {
    if (realLoggedIn && realUser) {
      return {
        id: realUser.id,
        name: realUser.full_name || realUser.email || 'Tangy Listener',
        email: realUser.email,
        role: realUser.role || 'patron',
      };
    }
    // Anonymous visitor — stable for this tab only (sessionId doubles as identity).
    return { id: `guest-${conversationId}`, name: 'Guest Visitor', email: null, role: 'guest' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const requester = resolveRequester();
    const categoryLabel = categories.find((c) => c.id === category)?.label || category || 'General';
    const combinedQuestion = [question.trim(), description.trim()].filter(Boolean).join(' — ') || 'No details provided.';

    // Creates/reuses the real conversation the Admin Inbox chats through, then
    // keeps the legacy ticket (category/priority) for continuity.
    const realConversationId = await conversationService.getOrCreateSupportConversation(
      categoryLabel,
      requester
    );
    await conversationService.sendMessage(realConversationId, { text: combinedQuestion, sender: requester });

    setSubmitting(false);
    onSubmitted?.({ conversationId: realConversationId }, requester);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="border-4 border-[#11100C] bg-[#F5E9C9] text-[#11100C] p-4 shadow-[6px_6px_0px_#11100C] flex flex-col gap-3"
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full font-mono text-xs font-bold uppercase tracking-widest bg-[#B94717] text-[#F5E9C9] hover:bg-[#11100C] border-2 border-[#11100C] py-2.5 transition-colors shadow-[3px_3px_0px_#11100C] active:scale-95 disabled:opacity-50"
      >
        {submitting ? 'SENDING...' : 'SEND TO TANGY TEAM →'}
      </button>
    </form>
  );
};
