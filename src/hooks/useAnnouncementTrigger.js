import { useState, useEffect, useCallback } from 'react';
import { announcementService } from '../services/announcementService';

const SEEN_KEY = 'tangy_seen_announcements';
const PRIORITY_RANK = { high: 3, normal: 2, low: 1 };

function getSeenIds() {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function markSeen(id) {
  try {
    const seen = getSeenIds();
    if (!seen.includes(id)) {
      sessionStorage.setItem(SEEN_KEY, JSON.stringify([...seen, id]));
    }
  } catch {
    // sessionStorage unavailable — fail silently, just won't dedupe this run.
  }
}

function isActive(announcement, now) {
  const publishAt = announcement.publishAt ? new Date(announcement.publishAt).getTime() : 0;
  const expireAt = announcement.expireAt ? new Date(announcement.expireAt).getTime() : null;
  if (Number.isNaN(publishAt) || publishAt > now) return false;
  if (expireAt !== null && (Number.isNaN(expireAt) || expireAt < now)) return false;
  return true;
}

function pickEligible(excludeSeen) {
  const now = Date.now();
  const seen = excludeSeen ? getSeenIds() : [];
  const candidates = announcementService
    .getPublished()
    .filter((a) => isActive(a, now) && (!excludeSeen || !seen.includes(a.id)));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const rankDiff = (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.publishAt || 0) - new Date(a.publishAt || 0);
  });
  return candidates[0];
}

/**
 * On mount, picks the highest-priority currently-active published
 * announcement that hasn't been shown yet this browser session, and exposes
 * state for a component to render <AnnouncementCharacterOverlay>.
 *
 * `triggerManually(announcement?)` bypasses the once-per-session check —
 * useful for an admin "Preview" button. Pass an announcement to preview a
 * specific one (including unsaved drafts), or omit to re-run the normal
 * eligibility pick ignoring the seen-list.
 */
export function useAnnouncementTrigger() {
  const [announcement, setAnnouncement] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const eligible = pickEligible(true);
    if (eligible) {
      setAnnouncement(eligible);
      setShow(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    setShow(false);
    if (announcement) markSeen(announcement.id);
  }, [announcement]);

  const triggerManually = useCallback((override) => {
    const target = override || pickEligible(false) || announcementService.getPublished()[0] || null;
    if (target) {
      setAnnouncement(target);
      setShow(true);
    }
  }, []);

  return { announcement, show, dismiss, triggerManually };
}
