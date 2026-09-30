// Shared helpers for enquiry / application forms. Every form requires a
// signed-in account (RLS: user_id = auth.uid(), migration 0025); these keep
// the forms' prefill, error wording and post-login destination consistent.
import { useEffect, useRef } from 'react';

// Only same-site paths are accepted as a post-login destination, so a
// crafted ?next= can't bounce someone to another site.
export function safeNext(next, fallback = '/dashboard') {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (/[\r\n]/.test(next)) return fallback;
  return next;
}

export function loginPath(next) {
  return `/join/login?next=${encodeURIComponent(safeNext(next, '/'))}`;
}

// Fills name / email / phone from the signed-in profile once, without
// overwriting anything the person has already typed.
export function useApplicantPrefill(user, { setName, setEmail, setPhone } = {}) {
  const done = useRef(false);
  useEffect(() => {
    if (!user || done.current) return;
    done.current = true;
    if (setName && user.full_name) setName((v) => v || user.full_name);
    if (setEmail && user.email) setEmail((v) => v || user.email);
    if (setPhone && user.phone) setPhone((v) => v || user.phone);
  }, [user, setName, setEmail, setPhone]);
}

// Server errors → words for the applicant.
export function applicationErrorMessage(error, fallback = 'Something went wrong — please try again.') {
  const msg = error?.message || '';
  if (msg.includes('DUPLICATE_APPLICATION')) {
    return msg.replace(/^.*DUPLICATE_APPLICATION:\s*/, '') || 'You already have a pending application of this kind.';
  }
  if (/row-level security|JWT|not authenticated/i.test(msg)) {
    return 'Your session has expired — please sign in again and resubmit.';
  }
  return fallback;
}

export const FORMS_OFFLINE_MESSAGE = 'Online forms are unavailable right now. Please email hello@tangysessions.com instead.';
