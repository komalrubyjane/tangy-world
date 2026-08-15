import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const PostcardContactModal = ({ isOpen, onClose }) => {
  const { playSFX } = useAudio();
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isMailed, setIsMailed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!senderName || !senderEmail || !message) return;
    playSFX('ticketClick');
    setIsMailed(true);
    setTimeout(() => {
      setIsMailed(false);
      onClose();
    }, 2800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* Fade Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/85 backdrop-blur-md" />

      {/* VINTAGE POSTCARD CONTACT FORM */}
      <div className="relative w-full max-w-2xl max-h-[90dvh] bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[14px_14px_0px_#4c1210] flex flex-col gap-5 z-10 overflow-y-auto overflow-x-hidden">
        
        {/* POSTCARD HEADER */}
        <div className="flex justify-between items-center border-b-2 border-[#191410] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em]">✉️ POSTCARD // CORRESPONDENCE DESK</span>
          </div>
          <button 
            onClick={onClose}
            className="font-mono text-xs font-bold border border-[#191410] px-3 py-1 text-[#191410] hover:bg-[#c2272a] hover:text-[#ecdcaf] transition-all"
          >
            ✕ CLOSE
          </button>
        </div>

        {isMailed ? (
          <div className="py-12 flex flex-col items-center gap-4 text-center animate-bounce">
            <div className="w-16 h-16 rounded-full bg-[#c2272a] text-[#ecdcaf] flex items-center justify-center font-poster text-2xl">
              ✓
            </div>
            <h3 className="font-poster text-2xl text-[#191410]">POSTCARD DISPATCHED!</h3>
            <p className="font-mono text-xs text-[#241a12]/80">YOUR LETTER HAS BEEN DROPPED INTO THE TANGY HYDERABAD MAILBOX.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* LEFT SIDE: MESSAGE BODY */}
            <div className="flex flex-col gap-3">
              <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">POSTCARD MESSAGE</span>
              <textarea
                required
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your note, session inquiry, or private booking request here..."
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/50 outline-none resize-none"
              />
            </div>

            {/* RIGHT SIDE: ADDRESS & STAMP */}
            <div className="flex flex-col justify-between gap-4 border-l-0 md:border-l-2 md:border-dashed border-[#191410]/30 md:pl-6">
              
              {/* POSTAGE STAMP */}
              <div className="flex justify-between items-start">
                <div className="font-mono text-[9px] text-[#241a12]/70 leading-tight">
                  <div>TO: TANGY SESSIONS</div>
                  <div>BANSILALPET STEPWELL</div>
                  <div>HYDERABAD, INDIA</div>
                </div>

                <div className="w-14 h-16 bg-[#ecdcaf] border-2 border-dashed border-[#c2272a] flex flex-col items-center justify-center text-center rotate-3 p-1">
                  <span className="font-mono text-[7px] font-bold text-[#c2272a]">POSTAGE</span>
                  <span className="font-poster text-xs text-[#191410]">₹50</span>
                  <span className="font-mono text-[6px]">HYD</span>
                </div>
              </div>

              {/* INPUT FIELDS */}
              <div className="flex flex-col gap-2">
                <input 
                  type="text"
                  required
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="w-full p-2.5 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <input 
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="YOUR EMAIL ADDRESS"
                  className="w-full p-2.5 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all"
              >
                STAMP & MAIL POSTCARD →
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
