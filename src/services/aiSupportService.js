// MOCK AI support engine — a structured knowledge-base lookup, NOT a trained
// model and NOT connected to any external AI API. See aiKnowledge.js for the
// content. FUTURE ARCHITECTURE: this file is the seam where a real system
// would plug in — Tangy Knowledge Base -> Embeddings/Retrieval -> AI model ->
// Tangy AI -> User. Swapping getAnswer()'s internals for a real retrieval +
// model call would not require touching the chat UI at all.
import { aiKnowledge, AI_CATEGORIES, getQuestionsByCategory, matchFreeText, findAnswerById } from '../data/mock/aiKnowledge';

export const aiSupportService = {
  getCategories: () => AI_CATEGORIES,
  getQuestionsForCategory: (categoryId) => getQuestionsByCategory(categoryId),
  getAllQuestions: () => aiKnowledge,

  getAnswerById(id) {
    return findAnswerById(id);
  },

  // Returns { matched: true, entry } or { matched: false } when nothing
  // in the knowledge base is confident enough to answer.
  askFreeText(text) {
    const entry = matchFreeText(text);
    if (!entry) return { matched: false };
    return { matched: true, entry };
  },
};
