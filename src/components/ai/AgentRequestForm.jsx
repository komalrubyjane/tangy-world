import { useState } from 'react';
import { agentService } from '../../services/agentService';
import { aiSupportService } from '../../services/aiSupportService';
import { useUserAuth } from '../../context/UserAuthContext';
import { useMockAuth } from '../../context/MockAuthContext';

// MockAuthProvider isn't mounted app-wide yet, so useMockAuth() can throw.
// This keeps the form usable regardless of which auth systems are active.
function useSafeMockAuth() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMockAuth();
  } catch {
    return null;
  }
}

const PRIORITIES = ['low', 'normal', 'high'];

/**
 * Escalation form — "REQUEST AN AGENT" flow. Purely a mock handoff: it
 * creates a pending agentRequest via agentService and leaves the
 * conversation in an "escalated" state. No auto-reply is simulated here.
 */
export const AgentRequestForm = ({ conversationId, initialCategory = '', initialQuestion = '', onCancel, onSubmitted }) => {
  const mockAuth = useSafeMockAuth();
  const { isLoggedIn: realLoggedIn, user: realUser } = useUserAuth();

  const [category, setCategory] = useState(initialCategory);
  const [question, setQuestion] = useState(initialQuestion);
  const [priority, setPriority] = useState('normal');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = aiSupportService.getCategories();

  const resolveRequester = () => {
    if (mockAuth?.isLoggedIn && mockAuth.user) {
      return {
        user: mockAuth.user.fullName || mockAuth.user.email || 'Tangy Member',
        role: mockAuth.user.role || 'member',
      };
    }
    if (realLoggedIn && realUser) {
      return {
        user: realUser.full_name || realUser.email || 'Tangy Listener',
        role: realUser.role || 'patron',
      };
    }
    return { user: 'Guest Visitor', role: 'guest' };
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const { user, role } = resolveRequester();
    const categoryLabel = categories.find((c) => c.id === category)?.label || category || 'General';
    const combinedQuestion = [question.trim(), description.trim()].filter(Boolean).join(' — ') || 'No details provided.';

    const request = agentService.create({
      user,
      role,
      category: categoryLabel,
      question: combinedQuestion,
      priority,
      conversationId,
    });

    setSubmitting(false);
    onSubmitted?.(request);
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
