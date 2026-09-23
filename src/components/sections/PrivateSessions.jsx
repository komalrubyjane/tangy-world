import { useAudio } from '../../audio/AudioContext';
import { useReveal } from '../../hooks/useReveal';

// 07 — PRIVATE SESSIONS. More restrained than the public archive: charcoal,
// one strong photograph, a letterpress invitation, gold used sparingly.
// The wax seal is the section's single physical detail.
export const PrivateSessions = () => {
  const { playSFX } = useAudio();
  const sectionRef = useReveal();

  return (
    <section ref={sectionRef} id="private-sessions" className="t-section theme-private filmGrain">

      <div className="t-container relative">
        <header className="text-center max-w-3xl mx-auto">
          <p className="reveal t-label sec-accent m-0">07 — Private experiences // By Tangy</p>
          <h2 className="reveal-type t-h1 registrationOffset text-[#EFE2C0] mt-4 mb-0" style={{ '--reg-ink': 'rgba(200,157,53,0.35)' }}><span className="rt">Private<br className="sm:hidden" /> Sessions</span></h2>
          <p className="reveal d2 t-label text-[#EFE2C0]/75 mt-6 mb-0">Your space. Our sound. One night that&rsquo;s yours.</p>
        </header>

        <div className="t-grid mt-14 md:mt-20 items-center gap-y-12">
          {/* ONE STRONG IMAGE */}
          <figure className="reveal-paper col-span-4 md:col-span-8 lg:col-span-6 m-0" style={{ '--rest-rot': '-0.6deg' }}>
            <div className="photoFrame photoFrame--dark paperShadow">
            <div className="photoFrame-img">
            <picture>
              <source
                type="image/webp"
                srcSet="/media/opt/gallery-tangy3-480.webp 480w, /media/opt/gallery-tangy3-800.webp 800w"
                sizes="(min-width: 1024px) 45vw, 92vw"
              />
              <img
                src="/media/gallery/tangy3.jpg"
                alt="Our people"
                loading="lazy"
                decoding="async"
                className="photo-bw drift-img block w-full aspect-[4/5] md:aspect-[16/10] lg:aspect-[4/5] object-cover"
              />
            </picture>
            </div>
            </div>
            <figcaption className="filmCaption text-[#EFE2C0]/60 mt-3">Fig. 07 — Our people</figcaption>
          </figure>

          {/* INVITATION CARD */}
          <div className="reveal-paper col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8" style={{ '--rest-rot': '0.7deg' }}>
            <div className="relative bg-[#EFE2C0] paperTexture paperShadow text-[#181614] p-7 md:p-10 border-[6px] border-double border-[#181614] outline outline-1 outline-[#C89D35]/50 outline-offset-4">
              {/* Wax seal */}
              <div className="absolute -top-6 right-3 md:-right-4 w-14 h-14 rounded-full bg-[#4A171D] border-2 border-[#181614] flex items-center justify-center rotate-[-8deg]" aria-hidden="true">
                <div className="w-[80%] h-[80%] rounded-full border border-[#C89D35] flex items-center justify-center">
                  <span className="font-display text-xl text-[#EFE2C0] leading-none">T</span>
                </div>
              </div>

              <div className="flex justify-between gap-3 archiveMetadata text-[#4A171D] pb-3 border-b border-[#181614]/40">
                <span>Tangy Private Sessions</span>
                <span>Hyderabad // By invitation</span>
              </div>

              <h3 className="display mt-7 mb-0 text-[clamp(2.4rem,3.6vw,3.4rem)] !leading-[0.95]">Make the night<br />your own.</h3>
              <p className="t-meta text-[#C89D35] mt-5 mb-0" aria-hidden="true">─── ✦ ───</p>
              <p className="t-quote text-[#181614]/90 mt-4 mb-0">
                &ldquo;Some performances aren&rsquo;t announced. They&rsquo;re created exclusively for those who ask.&rdquo;
              </p>

              <span className="reveal-stamp archiveStamp text-[#9a7424] mt-6" style={{ '--rest-rot': '-3deg' }}>By invitation only ✦ 33⅓ RPM</span>

              <ul className="list-none p-0 m-0 mt-6 flex flex-wrap gap-2">
                {['Private gatherings', 'House sessions', 'Brand experiences', 'Special venues'].map((t) => (
                  <li key={t} className="t-meta border border-[#181614]/60 px-2 py-1">{t}</li>
                ))}
              </ul>

              <a
                href="/private-sessions"
                onClick={() => playSFX('ticketClick')}
                className="t-btn w-full mt-8 !bg-[#4A171D] !border-[#4A171D] hover:!bg-[#181614] hover:!border-[#181614]"
              >
                Private sessions → View more
              </a>
            </div>
          </div>
        </div>

        <p className="folio text-right mt-14 mb-0" aria-hidden="true">— 07 —</p>
      </div>
    </section>
  );
};
