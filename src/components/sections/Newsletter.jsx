import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const Newsletter = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('IDLE'); // IDLE, SUBMITTING, SUCCESS
  const { playSFX } = useAudio();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    playSFX('ticketClick');
    setStatus('SUBMITTING');
    setTimeout(() => {
      setStatus('SUCCESS');
      setEmail('');
    }, 1000);
  };

  return (
    <section 
      id="inner-circle" 
      className="relative w-full py-28 md:py-36 bg-[#3A241A] text-[#D9C6A0] overflow-hidden flex flex-col items-center justify-center text-center border-t-8 border-[#4B2D22]"
    >
      {/* BACKGROUND NOISE & TUNGSTEN AMBIENT GLOW */}
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-25 mix-blend-overlay pointer-events-none z-0" />
      <div className="absolute inset-0 tungsten-glow pointer-events-none z-0" />

      {/* CROP MARKS */}
      <div className="absolute top-6 left-6 font-mono text-[9px] text-[#9E6D35] font-bold tracking-[0.25em] uppercase z-20 pointer-events-none">
        [ ✚ ] CROP MARK // INNER CIRCLE MAILING DESK
      </div>

      <div className="relative z-10 max-w-xl w-full px-4">
        <span className="font-mono text-[#9E6D35] text-[10px] tracking-[0.3em] font-bold uppercase mb-2 block">PRIVATE MAILING LIST</span>
        <h2 className="font-poster text-5xl md:text-7xl text-[#D9C6A0] mb-2 uppercase">INNER CIRCLE</h2>
        <p className="font-handwritten text-xl text-[#D9C6A0] mb-10">
          "The best stories are shared with those who stay close."
        </p>

        {status === 'SUCCESS' ? (
          <div className="border-4 border-[#35251A] p-6 bg-[#D9C6A0] text-[#35251A] shadow-archival">
             <h3 className="font-poster text-3xl font-bold mb-2 uppercase">YOU'RE IN THE CIRCLE ✦</h3>
             <p className="font-mono text-xs mb-4">Check your inbox for session confirmation.</p>
             <a 
               href="/inner-circle"
               className="btn-ticket inline-block text-xs font-mono font-bold uppercase tracking-widest py-2 px-4 !bg-[#9E6D35] !text-[#35251A] !border-2 !border-[#35251A]"
             >
               INNER CIRCLE → JOIN NOW
             </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 w-full">
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 w-full">
              <input 
                type="email" 
                placeholder="ENTER YOUR EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-grow bg-[#D9C6A0]/10 border-b-2 border-[#D9C6A0]/40 p-4 font-mono text-[#D9C6A0] placeholder:text-[#D9C6A0]/60 focus:outline-none focus:border-[#9E6D35] text-center md:text-left"
              />
              <button 
                type="submit"
                disabled={status === 'SUBMITTING'}
                className="btn-ticket shrink-0 !bg-[#7A2B24] !text-[#D9C6A0] !border-2 !border-[#35251A] py-3 px-6 font-mono text-xs font-bold uppercase"
              >
                {status === 'SUBMITTING' ? '...' : 'SUBSCRIBE →'}
              </button>
            </form>
            <a 
              href="/inner-circle" 
              className="btn-ticket py-2.5 px-6 font-mono text-xs font-bold uppercase tracking-widest !bg-[#9E6D35] !text-[#35251A] hover:!bg-[#D9C6A0] transition-colors mt-2 !border-2 !border-[#35251A]"
            >
              INNER CIRCLE → JOIN NOW
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
