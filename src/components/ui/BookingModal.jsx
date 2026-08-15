import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const BookingModal = ({ event, onClose }) => {
  const { playSFX } = useAudio();
  const [status, setStatus] = useState('IDLE'); // IDLE, SUBMITTING, CONFIRMED
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });

  if (!event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    setStatus('SUBMITTING');
    setTimeout(() => {
      setStatus('CONFIRMED');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl max-h-[90dvh] overflow-y-auto bg-[#E7D5A4] border-4 border-[#11100C] p-6 md:p-10 shadow-[20px_20px_0px_#11100C] text-[#11100C]">
        
        {/* Perforated Stub Edge Visual */}
        <div className="absolute -top-3 left-0 right-0 h-2 border-b-2 border-dashed border-[#11100C]" />

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#11100C] pb-4 mb-6">
          <div>
            <span className="font-mono text-[9px] font-bold text-[#B94717] tracking-[0.3em] uppercase block">TANGY SESSIONS // TICKET STUB</span>
            <h3 className="display text-3xl md:text-4xl text-[#11100C]">{event.title}</h3>
            <p className="font-mono text-[10px] opacity-70 mt-1">{event.venue} · {event.date} · {event.time}</p>
          </div>
          <button 
            onClick={onClose} 
            className="font-mono text-xs font-bold border-2 border-[#11100C] px-2.5 py-1 hover:bg-[#11100C] hover:text-[#E7D5A4] transition-colors"
          >
            ✕
          </button>
        </div>

        {status === 'CONFIRMED' ? (
          <div className="text-center py-10">
            <div className="inline-block border-4 border-[#5A120D] text-[#5A120D] font-mono text-xs font-bold tracking-[0.3em] px-4 py-2 rotate-[-6deg] mb-6 uppercase">
              CONFIRMED // ADMIT ONE
            </div>
            <h4 className="display text-4xl text-[#11100C] mb-3">TICKET ISSUED ✦</h4>
            <p className="font-mono text-xs text-[#11100C]/80 mb-6">Serial No. TS-{String(event.id).padStart(3, '0')} · {formData.email}</p>
            <button onClick={onClose} className="btn-ticket">
              CLOSE TICKET STUB
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex justify-between items-baseline font-mono text-xs border-b border-[#11100C]/20 pb-2">
              <span className="font-bold">ADMIT ONE PASS</span>
              <span className="text-[#B94717] font-bold text-base">{event.price}</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#11100C]">Full Name</label>
              <input 
                required 
                type="text" 
                placeholder="YOUR NAME"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-transparent border-b-2 border-[#11100C] p-2 font-mono text-sm focus:outline-none focus:border-[#B94717]" 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#11100C]">Phone</label>
                <input 
                  required 
                  type="tel" 
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-transparent border-b-2 border-[#11100C] p-2 font-mono text-sm focus:outline-none focus:border-[#B94717]" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#11100C]">Email</label>
                <input 
                  required 
                  type="email" 
                  placeholder="NAME@EMAIL.COM"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-transparent border-b-2 border-[#11100C] p-2 font-mono text-sm focus:outline-none focus:border-[#B94717]" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status === 'SUBMITTING'}
              className="btn-ticket mt-4 w-full text-center"
            >
              {status === 'SUBMITTING' ? 'ISSUING TICKET...' : 'CONFIRM TICKET →'}
            </button>
          </form>
        )}

        {/* Perforated Stub Bottom Bar */}
        <div className="mt-6 pt-4 border-t-2 border-dashed border-[#11100C] flex justify-between items-center font-mono text-[8px] opacity-70">
          <span>TS-001-HYD</span>
          <span>NON-TRANSFERABLE</span>
          <span>33⅓ RPM SESSIONS</span>
        </div>

      </div>
    </div>
  );
};
