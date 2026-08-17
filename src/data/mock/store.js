// Generic localStorage persistence layer for every mock data collection.
// Each data file calls loadOrSeed(key, seedFn) ONCE at module load to get a
// live, mutable array — seeded from seedFn() the first time, restored from
// localStorage on every load after that. Services keep mutating that same
// array reference directly (push/splice/Object.assign, as they already do)
// and call persist(key, array) after each mutation so changes survive a
// refresh. This is intentionally NOT a new state-management layer — it's the
// smallest possible addition that makes the existing array-based mock data
// files durable.
const PREFIX = 'tangy_mock_';

const registeredKeys = new Set();

export function loadOrSeed(key, seedFn) {
  const storageKey = PREFIX + key;
  registeredKeys.add(key);
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) return JSON.parse(raw);
  } catch {
    // fall through to reseed on corrupt data
  }
  const seed = seedFn();
  try {
    localStorage.setItem(storageKey, JSON.stringify(seed));
  } catch {
    // localStorage unavailable (e.g. private mode quota) — seed still works in-memory
  }
  return seed;
}

export function persist(key, value) {
  registeredKeys.add(key);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // best-effort; in-memory state still reflects the change this session
  }
}

// Reads a collection straight from localStorage, bypassing any in-memory
// cached array — used where cross-tab freshness matters more than the
// shared-reference-mutation pattern the rest of the mock layer relies on
// (e.g. AI conversation threads, which an admin tab and a visitor tab both
// read/write independently).
export function readFresh(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Wipes every mock data collection (bookings, events, artists, etc.) AND the
// mock auth session/account store, then reloads so all modules reseed fresh.
// Development-only affordance — never exposed prominently to end users.
export function resetAllMockData() {
  const keys = Object.keys(localStorage).filter(
    (k) => k.startsWith(PREFIX) || k === 'tangy_mock_session' || k === 'tangy_mock_v2_role_accounts'
  );
  keys.forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}
