import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { useReveal } from '../../hooks/useReveal';

// 09 — INNER CIRCLE. Deliberately the simplest section on the page:
// burgundy, one line, one field, one button.
export const Newsletter = () => {
  const { playSFX } = useAudio();
  const [status, setStatus] = useState('IDLE');
  const [email, setEmail] = useState('');
  const sectionRef = useReveal();

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
    <section ref={sectionRef} id="inner-circle" className="t-section theme-inner overflow-hidden">

      <div className="t-container relative max-w-[760px] text-center">
        <p className="reveal t-label sec-accent m-0">09 — Private mailing list</p>
        <h2 className="reveal-type t-h1 registrationOffset text-[#EFE2C0] mt-4 mb-0"><span className="rt">Inner Circle</span></h2>
        <p className="reveal d2 t-quote text-[#EFE2C0]/90 mt-5 mb-0">
          &ldquo;The best stories are shared with those who stay close.&rdquo;
        </p>

        {status === 'SUCCESS' ? (
          <div className="mt-10 inline-block text-left border-[3px] border-double border-[#EFE2C0]/40 p-6">
            <h3 className="t-h3 text-[#EFE2C0] m-0">You&rsquo;re in the circle ✦</h3>
            <p className="t-small text-[#EFE2C0]/80 mt-2 mb-5">Check your inbox for session confirmation.</p>
            <a href="/inner-circle" className="t-btn t-btn-light">Inner Circle → Join now</a>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="reveal d3 mt-10 flex flex-col sm:flex-row items-stretch gap-3 max-w-[600px] mx-auto p-4 border-[3px] border-double border-[#EFE2C0]/35">
              <label htmlFor="inner-circle-email" className="sr-only">Email address</label>
              <input
                id="inner-circle-email"
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 min-w-0 min-h-[48px] bg-transparent border border-[#EFE2C0]/45 px-4 font-mono text-sm text-[#EFE2C0] placeholder:text-[#EFE2C0]/50 focus:outline-none focus:border-[#C89D35]"
              />
              <button type="submit" disabled={status === 'SUBMITTING'} className="t-btn t-btn-light min-h-[48px]">
                {status === 'SUBMITTING' ? 'Joining…' : 'Join'}
              </button>
            </form>
            <a href="/inner-circle" className="t-link inline-block mt-6 text-[#EFE2C0]/75 hover:text-[#C89D35]">
              Inner Circle → Join now
            </a>
          </>
        )}
        <p className="folio mt-14 mb-0" aria-hidden="true">— 09 —</p>
      </div>
    </section>
  );
};
