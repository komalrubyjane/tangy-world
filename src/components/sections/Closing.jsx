import { useReveal } from '../../hooks/useReveal';

const DETAILS = [
  { label: 'Location', value: 'Hyderabad · Telangana, India' },
  { label: 'Dispatch', value: 'hello@tangysessions.com', href: 'mailto:hello@tangysessions.com' },
  { label: 'Archive', value: 'Instagram: @tangysessions' },
];

// 10 — CONTACT. The back page of the magazine: one monochrome photograph
// supporting the type, a short colophon, one call to action.
export const Closing = () => {
  const sectionRef = useReveal();

  return (
    <section ref={sectionRef} id="contact" className="t-section theme-contact overflow-hidden">

      <div className="t-container relative">
        <div className="t-grid items-center gap-y-12">
          <figure className="reveal-paper col-span-4 md:col-span-4 lg:col-span-5 m-0 max-w-[380px] md:max-w-none w-full mx-auto md:mx-0" style={{ '--rest-rot': '-1deg' }}>
            <div className="photoFrame paperShadow">
            <span className="tapeStrip -top-2.5 left-8 rotate-[-6deg]" aria-hidden="true" />
            <div className="photoFrame-img">
            <picture>
              <source type="image/webp" srcSet="/media/opt/gallery-tangy9-480.webp 480w, /media/opt/gallery-tangy9-800.webp 800w" sizes="(min-width: 1024px) 38vw, (min-width: 768px) 45vw, 92vw" />
              <img
                src="/media/gallery/tangy9.jpg"
                alt="After hours"
                loading="lazy"
                decoding="async"
                className="photo-bw drift-img block w-full aspect-[4/5] object-cover"
              />
            </picture>
            </div>
            </div>
            <figcaption className="filmCaption text-[#EFE2C0]/55 mt-4">Fig. 10 — After hours</figcaption>
          </figure>

          <div className="col-span-4 md:col-span-4 lg:col-span-6 lg:col-start-7">
            <p className="reveal t-label sec-accent m-0">10 — Contact // Magazine back page</p>
            <h2 className="reveal-type t-h1 registrationOffset text-[#EFE2C0] mt-4 mb-0"><span className="rt">
              Come<br /><span className="text-[#C89D35]">find us.</span>
            </span></h2>
            <p className="reveal d2 t-quote text-[#EFE2C0]/85 mt-5 mb-0">&ldquo;Every journey begins somewhere.&rdquo;</p>

            <dl className="reveal d2 mt-10 m-0 border-t-[3px] border-double border-[#EFE2C0]/25">
              {DETAILS.map((d) => (
                <div key={d.label} className="grid grid-cols-[7rem_1fr] gap-4 py-4 border-b border-[#EFE2C0]/20">
                  <dt className="archiveMetadata text-[#C89D35]">{d.label}</dt>
                  <dd className="m-0 font-mono text-sm text-[#EFE2C0]/90 break-words">
                    {d.href ? <a href={d.href} className="hover:text-[#C89D35]">{d.value}</a> : d.value}
                  </dd>
                </div>
              ))}
            </dl>

            <a href="/contact" className="reveal d2 t-btn t-btn-light mt-10">Contact → Visit Tangy</a>
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-16 pt-4 border-t border-[#EFE2C0]/15 archiveMetadata text-[#EFE2C0]/45">
          <span>Tangy Sessions · Hyderabad · Est. 2016</span>
          <span className="folio !opacity-100">— 10 —</span>
        </div>
      </div>
    </section>
  );
};
