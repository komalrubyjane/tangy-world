import { useState, useEffect } from 'react';
import { useUserAuth } from '../../context/UserAuthContext';
import { bookingService } from '../../lib/bookingService';
import { useAudio } from '../../audio/AudioContext';

export const DigitalPassportModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const { user } = useUserAuth();
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready

  useEffect(() => {
    if (!isOpen || !user) return;
    let cancelled = false;
    setStatus('loading');
    bookingService.getMyBookings(user.id).then((rows) => {
      if (cancelled) return;
      setBookings(rows);
      setStatus('ready');
    });
    return () => { cancelled = true; };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* TANGY MEMBER PASSPORT STAMP BOOK */}
      <div className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#3c0f0e] text-[#ecdcaf] border-4 border-[#d1a437] p-6 shadow-[14px_14px_0px_#191410] flex flex-col gap-5 z-10">

        {/* PASSPORT COVER HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#d1a437]/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#d1a437] tracking-[0.3em]">PASSPORT // MEMBER STAMP BOOK</span>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#ecdcaf] px-3 py-1 text-[#ecdcaf] hover:bg-[#c2272a] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* MEMBER ID CARD */}
        <div className="bg-[#191410] p-4 border-2 border-[#d1a437] shadow-md flex items-center gap-4 text-left">
          <div className="w-16 h-16 bg-[#ecdcaf] text-[#191410] rounded-full border-2 border-[#c2272a] flex flex-col items-center justify-center text-center">
            <span className="font-poster text-lg font-bold">TS</span>
            <span className="font-mono text-[7px] font-bold">HYD</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] text-[#d1a437] font-bold tracking-widest uppercase">PASSPORT NO: {user.passport_id || '—'}</span>
            <h3 className="font-poster text-xl text-[#ecdcaf]">{user.full_name || user.email}</h3>
            <span className="font-mono text-xs text-[#ecdcaf]/80">Member since {user.member_since ? new Date(user.member_since).getFullYear() : '—'}</span>
          </div>
        </div>

        {/* BOOKINGS / STAMPS */}
        {status === 'loading' ? (
          <div className="text-center py-8 font-mono text-xs font-bold text-[#ecdcaf]/60">LOADING YOUR STAMPS...</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-8 font-mono text-xs font-bold text-[#ecdcaf]/60 border-2 border-dashed border-[#ecdcaf]/20">
            NO STAMPS YET — BOOK A SESSION TO START YOUR COLLECTION.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
            {bookings.map((b) => (
              <div
                key={b.id}
                onClick={() => playSFX('ticketClick')}
                className="p-3 border-2 flex flex-col items-center text-center gap-1 bg-[#e9decb] text-[#241a12] border-[#191410] rotate-[-1deg] shadow-md"
              >
                <span className="font-mono text-[8px] font-bold text-[#c2272a] uppercase">{b.registration_code}</span>
                <h4 className="font-poster text-sm leading-tight uppercase my-0.5">{b.events?.name || 'Session'}</h4>
                <span className="font-mono text-[9px] opacity-80">{b.events?.event_date} · {b.events?.venue}</span>
                <span className={`font-mono text-[8px] font-black border px-2 py-0.5 mt-1 uppercase ${
                  b.status === 'confirmed' ? 'text-emerald-800 border-emerald-800' : 'text-[#8a5a1a] border-[#8a5a1a]'
                }`}>
                  {b.status === 'confirmed' ? '✓ CONFIRMED' : b.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="font-mono text-[9.5px] text-[#ecdcaf]/60 text-center pt-2 border-t border-[#ecdcaf]/20">
          ✦ SHOW YOUR TICKET QR CODE AT CHECK-IN
        </div>

      </div>
    </div>
  );
};
