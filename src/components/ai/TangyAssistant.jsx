import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { aiSupportService } from '../../services/aiSupportService';
import { messageService } from '../../services/messageService';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { AgentRequestForm } from './AgentRequestForm';

const GREETING = 'Hey. What would you like to know about Tangy?';
const SESSION_KEY = 'tangy_ai_session_id';

function getOrCreateSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

const chipClass =
  'px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-wide border-2 border-[#C99A2E]/70 text-[#E7D5A4] hover:bg-[#C99A2E] hover:text-[#11100C] transition-colors text-left';

const smallChipClass =
  'px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wide border-2 border-[#11100C]/50 text-[#11100C] hover:bg-[#11100C] hover:text-[#E7D5A4] transition-colors text-left';

const TypingIndicator = ({ reducedMotion }) => (
  <div className="flex justify-start mb-3">
    <div className="max-w-[70%] border-2 border-[#11100C] bg-[#F5E9C9] px-3 py-2.5 shadow-[3px_3px_0px_#11100C] flex items-center gap-2">
      <span className="font-mono text-[9px] font-bold tracking-[0.2em] uppercase text-[#B94717]">◆ TANGY AI</span>
      <div className="flex items-end gap-[3px] h-3.5" aria-label="Tangy AI is typing" role="status">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            className="w-[3px] bg-[#B94717] rounded-[1px]"
            style={{ height: 5 }}
            animate={reducedMotion ? { height: 7 } : { height: [4, 14, 4] }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 0.9, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut' }
            }
          />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Tangy Assistant — MOCK AI chat. This is a structured knowledge-base
 * lookup (see src/data/mock/aiKnowledge.js), not a trained model and not
 * connected to any external AI API. Every AI message is clearly labelled
 * "TANGY AI" and never pretends to be a human.
 *
 * Props:
 *  - variant: 'page' | 'floating' (default 'page')
 *  - onClose: optional close handler, used by the floating launcher panel
 */
export const TangyAssistant = ({ variant = 'page', onClose }) => {
  const isFloating = variant === 'floating';
  const reducedMotion = useReducedMotion();
  const sessionIdRef = useRef(getOrCreateSessionId());
  const sessionId = sessionIdRef.current;

  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const [pickerOpen, setPickerOpen] = useState(true);
  const [pickerCategory, setPickerCategory] = useState(null);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [lastUnmatchedText, setLastUnmatchedText] = useState('');
  const [escalation, setEscalation] = useState(null);

  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const existing = messageService.getConversation(sessionId);
    if (existing.length === 0) {
      const seeded = messageService.sendAiMessage(sessionId, GREETING, { greeting: true });
      setMessages(seeded);
    } else {
      setMessages(existing);
    }
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const withTyping = useCallback((cb) => {
    setTyping(true);
    const delay = 400 + Math.random() * 300; // 400–700ms
    typingTimeoutRef.current = window.setTimeout(() => {
      setTyping(false);
      cb();
    }, delay);
  }, []);

  const respondWithEntry = useCallback((entry) => {
    const updated = messageService.sendAiMessage(sessionId, entry.answer, {
      cta: entry.cta || null,
      related: entry.related || null,
      entryId: entry.id,
    });
    setMessages(updated);
  }, [sessionId]);

  const respondUnmatched = useCallback((text) => {
    messageService.sendAiMessage(sessionId, "I don't have enough information to answer that accurately.");
    const updated = messageService.sendAiMessage(sessionId, 'Would you like to speak with the Tangy team?', {
      unmatched: true,
      lastQuestion: text,
    });
    setMessages(updated);
  }, [sessionId]);

  const handleAskPredefined = useCallback((id) => {
    const entry = aiSupportService.getAnswerById(id);
    if (!entry) return;
    const updated = messageService.sendUserMessage(sessionId, entry.question);
    setMessages(updated);
    withTyping(() => respondWithEntry(entry));
  }, [sessionId, withTyping, respondWithEntry]);

  const handleFreeTextSubmit = (e) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    const updated = messageService.sendUserMessage(sessionId, text);
    setMessages(updated);
    withTyping(() => {
      const result = aiSupportService.askFreeText(text);
      if (result.matched) {
        respondWithEntry(result.entry);
      } else {
        setLastUnmatchedText(text);
        respondUnmatched(text);
      }
    });
  };

  const openAgentForm = (prefillQuestion) => {
    if (prefillQuestion) setLastUnmatchedText(prefillQuestion);
    setShowAgentForm(true);
  };

  const handleAgentSubmitted = (request) => {
    setShowAgentForm(false);
    setEscalation(request);
    messageService.sendAiMessage(sessionId, 'Your request has reached the Tangy team.', { escalationNotice: true });
    const updated = messageService.sendAiMessage(sessionId, 'Someone from the team will join this conversation.', {
      escalationNotice: true,
    });
    setMessages(updated);
  };

  const categories = aiSupportService.getCategories();
  const questionsForCategory = pickerCategory ? aiSupportService.getQuestionsForCategory(pickerCategory) : [];

  const bubbleMotionProps = reducedMotion
    ? {}
    : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25 } };

  const renderBubble = (msg) => {
    const isUser = msg.sender === 'user';
    const isTeam = msg.sender === 'team';
    const isAi = msg.sender === 'ai';
    return (
      <motion.div key={msg.id} {...bubbleMotionProps} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
        <div
          className={`max-w-[88%] sm:max-w-[75%] border-2 px-3 py-2.5 font-serif text-sm leading-relaxed shadow-[3px_3px_0px_#11100C] ${
            isUser
              ? 'bg-[#E7D5A4] border-[#11100C] text-[#11100C]'
              : isTeam
              ? 'bg-[#5A120D] border-[#11100C] text-[#F5E9C9]'
              : 'bg-[#F5E9C9] border-[#11100C] text-[#11100C]'
          }`}
        >
          {!isUser && (
            <div
              className={`font-mono text-[9px] font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-1.5 ${
                isTeam ? 'text-[#E7D5A4]' : 'text-[#B94717]'
              }`}
            >
              <span>{isTeam ? '● TANGY TEAM' : '◆ TANGY AI'}</span>
              {isAi && <span className="opacity-60 font-normal normal-case">(automated, not human)</span>}
            </div>
          )}
          <p className="whitespace-pre-wrap">{msg.text}</p>
          {msg.cta && (
            <Link
              to={msg.cta.to}
              className="inline-block mt-2 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#11100C] text-[#E7D5A4] px-3 py-1.5 hover:bg-[#B94717] transition-colors"
            >
              {msg.cta.label} →
            </Link>
          )}
          {Array.isArray(msg.related) && msg.related.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {msg.related.map((rid) => {
                const rq = aiSupportService.getAnswerById(rid);
                if (!rq) return null;
                return (
                  <button key={rid} type="button" onClick={() => handleAskPredefined(rid)} className={smallChipClass}>
                    {rq.question}
                  </button>
                );
              })}
            </div>
          )}
          {msg.unmatched && (
            <button
              type="button"
              onClick={() => openAgentForm(msg.lastQuestion)}
              className="mt-2 block font-mono text-[10px] font-bold uppercase tracking-widest bg-[#B94717] text-[#F5E9C9] px-3 py-1.5 hover:bg-[#11100C] transition-colors"
            >
              [ REQUEST AN AGENT ]
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className={`flex flex-col bg-[#11100C] border-4 border-[#11100C] shadow-[8px_8px_0px_#11100C] w-full ${
        isFloating ? 'h-[75dvh] max-h-[600px]' : 'h-[72vh] min-h-[520px] max-h-[760px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b-4 border-[#C99A2E] bg-[#1A140F]">
        <div className="min-w-0">
          <div className="font-mono text-[9px] font-bold tracking-[0.25em] uppercase text-[#C99A2E]">✦ TANGY ASSISTANT</div>
          <div className="font-display text-sm text-[#E7D5A4] uppercase tracking-wide truncate">Mock Knowledge-Base Guide</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => openAgentForm()}
            className="hidden sm:inline font-mono text-[9px] font-bold uppercase tracking-widest text-[#E7D5A4]/70 hover:text-[#C99A2E] underline"
          >
            Talk to a human
          </button>
          {isFloating && typeof onClose === 'function' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Tangy Assistant"
              className="font-mono text-sm font-bold text-[#E7D5A4] hover:text-[#C2272A] px-1"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Message log */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 bg-[#191410]"
        style={{ backgroundImage: "url('/noise.png')", backgroundBlendMode: 'multiply', backgroundSize: '180px' }}
      >
        {messages.map((m) => renderBubble(m))}
        {typing && <TypingIndicator reducedMotion={reducedMotion} />}
      </div>

      {/* Escalation banner */}
      {escalation && (
        <div className="px-3 py-1.5 bg-[#C99A2E] text-[#11100C] font-mono text-[9px] font-bold uppercase tracking-widest text-center border-t-2 border-[#11100C]">
          ✓ REQUEST SENT — REFERENCE #{escalation.id}
        </div>
      )}

      {/* Agent form OR topics + composer */}
      {showAgentForm ? (
        <div className="p-3 border-t-2 border-[#C99A2E]/40 bg-[#1A140F] max-h-[70%] overflow-y-auto">
          <AgentRequestForm
            conversationId={sessionId}
            initialCategory={pickerCategory || ''}
            initialQuestion={lastUnmatchedText}
            onCancel={() => setShowAgentForm(false)}
            onSubmitted={handleAgentSubmitted}
          />
        </div>
      ) : (
        <>
          {/* Topics picker */}
          <div className="border-t-2 border-[#C99A2E]/40 bg-[#1A140F] px-3 py-2">
            <button
              type="button"
              onClick={() => setPickerOpen((o) => !o)}
              className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#C99A2E]"
            >
              {pickerOpen ? 'HIDE TOPICS ▲' : 'BROWSE TOPICS ▼'}
            </button>
            {pickerOpen && (
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {!pickerCategory
                  ? categories.map((c) => (
                      <button key={c.id} type="button" onClick={() => setPickerCategory(c.id)} className={chipClass}>
                        {c.label}
                      </button>
                    ))
                  : (
                      <>
                        <button type="button" onClick={() => setPickerCategory(null)} className={chipClass}>
                          ← BACK
                        </button>
                        {questionsForCategory.map((q) => (
                          <button key={q.id} type="button" onClick={() => handleAskPredefined(q.id)} className={chipClass}>
                            {q.question}
                          </button>
                        ))}
                      </>
                    )}
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleFreeTextSubmit} className="flex items-center gap-2 p-3 border-t-4 border-[#C99A2E] bg-[#1A140F]">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Tangy Assistant..."
              aria-label="Ask Tangy Assistant"
              className="flex-1 min-w-0 bg-[#F5E9C9] border-2 border-[#11100C] px-3 py-2 font-serif text-sm text-[#11100C] focus:outline-none focus:border-[#B94717]"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="shrink-0 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#B94717] text-[#F5E9C9] hover:bg-[#C99A2E] hover:text-[#11100C] border-2 border-[#11100C] px-3 py-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              SEND
            </button>
          </form>
        </>
      )}
    </div>
  );
};
