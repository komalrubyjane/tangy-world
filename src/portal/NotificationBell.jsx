import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, cx, fmt } from '../admin/ui';
import { useNotifications } from './useNotifications';

// Header bell with unread count and the latest notifications. Clicking one
// marks it read and follows its deep link. Shared by the admin console and
// every partner/volunteer portal.
export const NotificationBell = ({ userId, allHref }) => {
  const { count, items, error, markRead } = useNotifications(userId);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const follow = async (n) => {
    setOpen(false);
    if (!n.read_at) markRead([n.id]).catch(() => {});
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label={count ? `Notifications, ${count} unread` : 'Notifications'} aria-expanded={open}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded text-[#E7D5A4]/75 hover:bg-[#C99A2E]/10 hover:text-[#EFE2C0]">
        <Icon name="Bell" size={18} />
        {count > 0 && (
          <span data-unread-count={count} className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#B94717] text-white text-[10px] font-mono inline-flex items-center justify-center tabular-nums">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {open && (
        <div role="dialog" aria-label="Notifications" className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[360px] z-[10010] bg-[#15110D] border border-[#C99A2E]/35 rounded-md shadow-[0_18px_50px_rgba(0,0,0,0.6)] font-sans">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#C99A2E]/15">
            <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#C99A2E]">Notifications</span>
            {count > 0 && <button onClick={() => markRead(null)} className="text-[11.5px] text-[#E7D5A4]/60 hover:text-[#EFE2C0] underline underline-offset-2">Mark all read</button>}
          </div>
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-[#E7D5A4]/[0.06]">
            {error && <li className="px-4 py-6 text-center text-[12.5px] text-[#ef6b5e]">{error.message}</li>}
            {!error && items === null && <li className="px-4 py-6 text-center text-[12.5px] text-[#E7D5A4]/60">Loading…</li>}
            {!error && items?.length === 0 && <li className="px-4 py-8 text-center text-[12.5px] text-[#E7D5A4]/60">No notifications</li>}
            {items?.map((n) => (
              <li key={n.id}>
                <button onClick={() => follow(n)} className={cx('w-full text-left px-4 py-3 hover:bg-[#C99A2E]/[0.07] flex gap-2.5', !n.read_at && 'bg-[#C99A2E]/[0.04]')}>
                  <span className={cx('mt-1.5 w-1.5 h-1.5 rounded-full shrink-0', n.read_at ? 'bg-transparent' : 'bg-[#e4bd5c]')} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] text-[#EFE2C0] leading-snug">{n.title}</span>
                    {n.body && <span className="block text-[12px] text-[#E7D5A4]/55 mt-0.5 line-clamp-2">{n.body}</span>}
                    <span className="block font-mono text-[10px] text-[#E7D5A4]/60 mt-1">{fmt.relative(n.created_at)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {allHref && (
            <button onClick={() => { setOpen(false); navigate(allHref); }} className="w-full px-4 py-2.5 border-t border-[#C99A2E]/15 text-[12px] text-[#E7D5A4]/65 hover:text-[#EFE2C0]">
              View all notifications
            </button>
          )}
        </div>
      )}
    </div>
  );
};
