import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { waitlistErrorMessage } from '../../hooks/useSessionDetail';

const btn = 'w-full h-11 font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] disabled:opacity-50';

function formatTime(iso) {
  return new Date(iso).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', day: 'numeric', month: 'short' });
}

// Sold-out session: join / see your place / leave. Everything is decided by
// the server (join_waitlist / leave_waitlist, migration 0027) — this only
// shows the result. An offer is shown by the booking page itself, since the
// holder then books through normal checkout.
export function WaitlistPanel({ session, entry, isLoggedIn, onSignIn, onChange }) {
  const min = session.bookingMin ?? 1;
  const max = session.bookingMax ?? 10;
  const [quantity, setQuantity] = useState(min);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ kind: '', text: '' });

  const join = async () => {
    setBusy(true);
    setMessage({ kind: '', text: '' });
    const { data, error } = await supabase.rpc('join_waitlist', { p_event_id: session.id, p_quantity: quantity });
    setBusy(false);
    if (error) {
      setMessage({ kind: 'error', text: waitlistErrorMessage(error) });
      if (/SEATS_AVAILABLE/.test(error.message)) onChange?.();
      return;
    }
    setMessage({ kind: 'ok', text: `You're on the waitlist — position ${data.position}. We'll notify you if seats open up.` });
    onChange?.();
  };

  const leave = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('leave_waitlist', { p_event_id: session.id });
    setBusy(false);
    if (error) {
      setMessage({ kind: 'error', text: waitlistErrorMessage(error) });
      return;
    }
    setMessage({ kind: 'ok', text: 'You have left the waitlist.' });
    onChange?.();
  };

  return (
    <div className="flex flex-col gap-3" data-waitlist-panel>
      <div className="p-3 bg-[#4A171D] text-[#ecdcaf] font-mono text-xs font-bold text-center border-2 border-[#191410]">
        THIS SESSION IS SOLD OUT.
      </div>

      {entry?.status === 'waiting' ? (
        <>
          <p className="font-mono text-xs text-[#191410] m-0" role="status" data-waitlist-position>
            You're on the waitlist for {entry.quantity} {entry.quantity === 1 ? 'person' : 'people'} — <strong>position {entry.queue_position}</strong>.
            If seats open up we'll hold them for you and notify you (in-app, and by email once email is set up).
          </p>
          <button type="button" onClick={leave} disabled={busy} className={`${btn} bg-transparent text-[#191410] hover:bg-[#191410]/10`} data-waitlist-leave>
            {busy ? 'Updating…' : 'Leave the waitlist'}
          </button>
        </>
      ) : !isLoggedIn ? (
        <>
          <p className="font-mono text-xs text-[#191410]/80 m-0">Join the waitlist and we'll hold seats for you if any are released.</p>
          <button type="button" onClick={onSignIn} className={`${btn} bg-[#c2272a] text-[#ecdcaf] hover:bg-[#191410]`}>Sign in to join the waitlist →</button>
        </>
      ) : (
        <>
          <p className="font-mono text-xs text-[#191410]/80 m-0">
            Join the waitlist. When seats are released they're offered in order and held for you for a limited time.
          </p>
          <div className="flex items-center justify-between gap-3 bg-[#181614] text-[#ecdcaf] p-3 border border-[#191410]">
            <span id="wl-people" className="font-mono text-xs font-bold">People</span>
            <div role="group" aria-labelledby="wl-people" className="flex items-center gap-3">
              <button type="button" aria-label="Fewer people" disabled={quantity <= min} onClick={() => setQuantity((q) => Math.max(min, q - 1))}
                className="w-[44px] h-[44px] bg-[#c2272a] text-[#ecdcaf] font-bold text-lg border border-[#ecdcaf] disabled:opacity-40">−</button>
              <output aria-live="polite" className="font-poster text-xl text-[#d1a437] min-w-[1.5rem] text-center">{quantity}</output>
              <button type="button" aria-label="More people" disabled={quantity >= max} onClick={() => setQuantity((q) => Math.min(max, q + 1))}
                className="w-[44px] h-[44px] bg-[#c2272a] text-[#ecdcaf] font-bold text-lg border border-[#ecdcaf] disabled:opacity-40">+</button>
            </div>
          </div>
          <button type="button" onClick={join} disabled={busy} className={`${btn} bg-[#c2272a] text-[#ecdcaf] hover:bg-[#191410]`} data-waitlist-join>
            {busy ? 'Joining…' : 'Join the waitlist'}
          </button>
        </>
      )}

      {message.text && (
        <p role={message.kind === 'error' ? 'alert' : 'status'} className={`font-mono text-[11px] m-0 ${message.kind === 'error' ? 'text-[#c2272a] font-bold' : 'text-[#2e6834] font-bold'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}

export function WaitlistOfferBanner({ entry }) {
  return (
    <div role="status" className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-[11px] border-2 border-[#191410]" data-waitlist-offer>
      <strong className="block text-xs">SEATS HELD FOR YOU</strong>
      We're holding {entry.quantity} {entry.quantity === 1 ? 'seat' : 'seats'} for you until {formatTime(entry.offer_expires_at)}. Complete your booking below to keep them.
    </div>
  );
}
