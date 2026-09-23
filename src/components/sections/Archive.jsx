import { gallery } from '../../data/mockData';
import { useReveal } from '../../hooks/useReveal';

// Photos in /media/gallery have pre-generated WebP variants in /media/opt.
const gallerySrcSet = (src) => {
  const m = src.match(/\/media\/gallery\/(.+)\.jpg$/);
  return m ? `/media/opt/gallery-${m[1]}-480.webp 480w, /media/opt/gallery-${m[1]}-800.webp 800w` : undefined;
};

// 04 — ARCHIVE. A contact sheet laid on aged paper: photography is the hero,
// every frame shares one markup and one monochrome treatment, and the only
// print details are frame numbers and the film edge.
export const Archive = () => {
  const sectionRef = useReveal();

  return (
    <section ref={sectionRef} id="archive" className="t-section theme-archive overflow-hidden">

      <div className="t-container relative">
        <header className="t-grid items-end gap-y-6">
          <div className="col-span-4 md:col-span-5 lg:col-span-7">
            <p className="reveal t-label sec-accent m-0">04 — Analogue contact sheet // File 35mm</p>
            <h2 className="reveal-type t-h1 registrationOffset text-[#181614] mt-4 mb-0" style={{ '--reg-ink': 'rgba(181,83,42,0.35)' }}><span className="rt">The Archive</span></h2>
            <span className="reveal-stamp archiveStamp text-[#8a2320] mt-6" style={{ '--rest-rot': '-6deg' }}>Classified // Archival record ✦</span>
          </div>
          <div className="reveal d2 col-span-4 md:col-span-3 lg:col-span-4 lg:col-start-9 flex flex-col items-start md:items-end gap-5">
            <p className="t-quote text-[#181614]/85 m-0 md:text-right">&ldquo;Every gathering leaves behind more than photographs.&rdquo;</p>
            <a href="/archive" className="t-btn">Archive → View more</a>
          </div>
        </header>

        {/* THE SHEET */}
        <div className="reveal-paper contactSheet paperShadow mt-12 md:mt-16" style={{ '--rest-rot': '0.4deg' }}>
          {/* Taped to the catalogue page at two corners */}
          <span className="tapeStrip -top-2 left-6 rotate-[-8deg]" aria-hidden="true" />
          <span className="tapeStrip -top-2 right-6 rotate-[6deg]" aria-hidden="true" />
          <div className="flex justify-between archiveMetadata text-[#EFE2C0]/60 px-4 pt-3">
            <span>Eastman 5247</span>
            <span>Tangy Sessions · Hyderabad</span>
          </div>
          <ol className="list-none m-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 p-4">
            {gallery.map((photo, i) => (
              <li key={photo.id} className="m-0">
                <figure className="reveal-frame m-0" style={{ transitionDelay: `${250 + i * 60}ms` }}>
                  <div className="photoFrame-img aspect-[4/5] bg-black">
                    <img
                      src={photo.src}
                      srcSet={gallerySrcSet(photo.src)}
                      sizes="(min-width: 1024px) 18vw, (min-width: 768px) 30vw, 46vw"
                      alt={photo.label}
                      loading="lazy"
                      decoding="async"
                      className="photo-bw w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="flex justify-between gap-2 mt-2 archiveMetadata text-[#EFE2C0]/75">
                    <span className="truncate">{photo.label}</span>
                    <span className="shrink-0 text-[#C89D35]">▸ {String(i + 1).padStart(2, '0')}A</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ol>
        </div>

        <p className="folio text-right mt-10 mb-0" aria-hidden="true">— 04 —</p>
      </div>
    </section>
  );
};
