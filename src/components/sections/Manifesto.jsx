import { useReveal } from '../../hooks/useReveal';

// 02 — WHY TANGY. An editorial archive page: warm paper, dark type, one
// archival photograph, generous negative space. The single physical detail
// is the strip of tape holding the photo to the page.
export const Manifesto = () => {
  const sectionRef = useReveal();

  return (
    <section ref={sectionRef} id="manifesto" className="t-section theme-about overflow-hidden">

      <div className="t-container relative">
        {/* Running head, like the top of a printed page */}
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 archiveMetadata text-[#181614]/70 pb-3 border-b-[3px] border-double border-[#181614]/45">
          <span>Tangy Archive // Museum Exhibit</span>
          <span>Issue No. 02</span>
          <span className="hidden sm:inline">Hyderabad · Est. 2016</span>
        </div>

        <div className="t-grid gap-y-0 mt-10 md:mt-14 items-start">
          {/* TEXT COLUMN — `contents` below lg so the photograph can slot in
              right after the headline on phones/tablets (heading → photo →
              copy → quote/CTA); a normal column beside the photo on desktop. */}
          <div className="contents lg:block lg:col-span-7">
            <p className="reveal t-label sec-accent m-0 col-span-4 md:col-span-8 order-1 lg:order-none">02 — Why Tangy</p>
            <h2 className="reveal-type t-h1 registrationOffset text-[#181614] mt-4 mb-0 col-span-4 md:col-span-8 order-2 lg:order-none" style={{ '--reg-ink': 'rgba(181,83,42,0.35)' }}><span className="rt">
              Why<br />Tangy?
            </span></h2>
            <p className="reveal d2 t-h3 text-[#181614] mt-6 mb-0 max-w-[28ch] col-span-4 md:col-span-8 order-3 lg:order-none">
              We don&rsquo;t just host shows. We create memories.
            </p>

            <div className="reveal d2 grid md:grid-cols-2 gap-6 md:gap-8 mt-8 t-body text-[#181614]/85 col-span-4 md:col-span-8 order-5 lg:order-none">
              <p className="m-0">
                A room became a stage. A stage became a gathering. A gathering became a memory — and the memory kept playing. Tangy Sessions was born out of a refusal to let music stay quiet or generic.
              </p>
              <p className="m-0">
                We collaborate with ancient stepwells, heritage architecture, and underground soundscapes to give independent Indian artists a home where every note echoes through history.
              </p>
            </div>

            <div className="reveal d2 mt-10 pt-6 border-t border-[#181614]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-5 col-span-4 md:col-span-8 order-6 lg:order-none">
              <p className="t-quote text-[#181614]/90 m-0 max-w-[32ch]">
                &ldquo;We started with one forgotten stepwell. Today, every performance carries another story.&rdquo;
              </p>
              <a href="/about" className="t-btn shrink-0">Why Tangy → View more</a>
            </div>
          </div>

          {/* ARCHIVAL PHOTOGRAPH */}
          <figure
            className="reveal-paper col-span-4 md:col-span-6 md:col-start-2 lg:col-span-4 lg:col-start-9 m-0 mt-10 lg:mt-24 order-4 lg:order-none max-w-[380px] md:max-w-none mx-auto md:mx-0 w-full"
            style={{ '--rest-rot': '-1.5deg' }}
          >
            <div className="photoFrame paperShadow">
              <span className="tapeStrip -top-2.5 left-1/2 -translate-x-1/2 rotate-[-3deg]" aria-hidden="true" />
              <div className="photoFrame-img">
                <img
                  src="/media/gallery/tangy4.jpg"
                  srcSet="/media/opt/gallery-tangy4-480.webp 480w, /media/opt/gallery-tangy4-800.webp 800w"
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 60vw, 92vw"
                  alt="Tangy crowd"
                  loading="lazy"
                  decoding="async"
                  className="photo-bw drift-img block w-full aspect-[4/5] object-cover"
                />
              </div>
            </div>
            <figcaption className="filmCaption text-[#181614]/70 mt-4">Fig. 02.1 — Tangy crowd</figcaption>
          </figure>
        </div>

        <p className="folio text-right mt-14 mb-0" aria-hidden="true">— 02 —</p>
      </div>
    </section>
  );
};
