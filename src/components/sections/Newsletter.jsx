import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';

export const Newsletter = () => {
  const { playSFX } = useAudio();
  const [status, setStatus] = useState('IDLE');
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;
    playSFX('ticketClick');
    setStatus('SUBMITTING');
    setTimeout(() => {
      setStatus('SUCCESS');
    }, 1000);
  };

  return (
    <section className="relative w-full py-16 sm:py-24 bg-[#694323] border-t-8 border-[#11100C] text-center flex flex-col items-center justify-center">
      <div className="absolute inset-0 bg-[url('/noise.png')] opacity-15 mix-blend-multiply pointer-events-none" />
      
      <div className="relative z-10 max-w-xl w-full px-4">
        <span className="font-mono text-tangy-mustard text-[10px] tracking-[0.3em] font-bold uppercase mb-2 block">PRIVATE MAILING LIST</span>
        <h2 className="display text-5xl md:text-7xl text-[#E3D4AC] mb-2 ink-bleed">INNER CIRCLE</h2>
        <p className="font-serif italic text-sm md:text-base text-[#E3D4AC]/90 mb-10">
          "The best stories are shared with those who stay close."
        </p>

        {status === 'SUCCESS' ? (
          <div className="border-4 border-[#11100C] p-6 bg-[#E3D4AC] text-[#11100C] shadow-[10px_10px_0_#11100C]">
             <h3 className="font-display text-3xl font-bold mb-2">YOU'RE IN THE CIRCLE ✦</h3>
             <p className="font-mono text-xs mb-4">Check your inbox for session confirmation.</p>
             <a 
               href="/inner-circle"
               className="btn-ticket inline-block text-xs font-mono font-bold uppercase tracking-widest py-2 px-4 !bg-[#C99A2E] !text-[#11100C]"
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
                className="flex-grow bg-transparent border-b-2 border-[#E3D4AC]/40 p-4 font-mono text-[#E3D4AC] focus:outline-none focus:border-tangy-mustard text-center md:text-left"
              />
              <button 
                type="submit"
                disabled={status === 'SUBMITTING'}
                className="btn-ticket shrink-0"
              >
                {status === 'SUBMITTING' ? '...' : 'SUBSCRIBE →'}
              </button>
            </form>
            <a 
              href="/inner-circle" 
              className="btn-ticket py-2.5 px-6 font-mono text-xs font-bold uppercase tracking-widest !bg-[#C99A2E] !text-[#11100C] hover:!bg-[#E3D4AC] transition-colors mt-2"
            >
              INNER CIRCLE → JOIN NOW
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
