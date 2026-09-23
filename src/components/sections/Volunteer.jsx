import { useState } from 'react';
import { useAudio } from '../../audio/AudioContext';
import { useReveal } from '../../hooks/useReveal';
import { gallery, artists } from '../../data/mockData';

const DOSSIERS = [
  {
    key: 'vol',
    tab: 'Dossier No. 07-V // Behind the scenes',
    tabTone: 'bg-[#e9dcb9] text-[#3F4735]',
    stamp: 'Classified // Hyd 1974',
    stampTone: 'text-[#8a2320]',
    rot: '-0.7deg',
    path: 'Path 01 // Production desk',
    title: 'Volunteer',
    note: '“Help build the nights, the stories and everything that happens between them.”',
    photo: { src: gallery[4]?.src || '/media/gallery/tangy5.jpg', webp: '/media/opt/gallery-tangy5-480.webp', alt: 'Stagehands sound check', caption: 'Stage & production' },
    tags: ['Events', 'Production', 'Creative', 'Hospitality', 'Community'],
    detailsTitle: 'Recruitment details',
    details: ['Access to all 2025-2026 Tangy Sessions behind-the-scenes.', 'Hands-on experience with analogue sound rigs & monument lighting.'],
    cta: { href: '/apply/crew', label: 'Join the crew → Apply now' },
  },
  {
    key: 'art',
    tab: 'Dossier No. 08-A // On the stage',
    tabTone: 'bg-[#B5532A] text-[#EFE2C0]',
    stamp: 'Audition // 33⅓ RPM',
    stampTone: 'text-[#B5532A]',
    rot: '0.8deg',
    path: 'Path 02 // Artist portfolio',
    title: 'Artist',
    note: '“Bring your sound, your story and your energy into the Tangy world.”',
    photo: { src: artists[6]?.image || '/media/artists/artist7.jpg', webp: '/media/opt/artist7-600.webp', alt: 'Live vocalist performing', caption: 'Live audition // Stage A' },
    tags: ['Musicians', 'DJs', 'Bands', 'Producers', 'Performers'],
    detailsTitle: 'Audition criteria',
    details: ['Performers of all analog, live electronic & acoustic genres welcome.', 'Submit demo recordings for season curation.'],
    cta: { href: '/artist/register', label: 'Apply as artist →' },
  },
];

const PARTNERS = [
  { no: '01', band: '#C89D35', bandInk: '#181614', rot: '-0.6deg', kind: 'Partner', title: 'Vendors', body: 'Chai stalls, artisanal food popups, vintage print presses, and craft makers bringing local flavor to every session.', href: '/apply/vendors' },
  { no: '02', band: '#B5532A', bandInk: '#EFE2C0', rot: '0.5deg', kind: 'Sponsor', title: 'Sponsors', body: 'Cultural foundations, audio gear brands, and independent supporters powering heritage music preservation.', href: '/apply/sponsors' },
  { no: '03', band: '#5A6E80', bandInk: '#EFE2C0', rot: '-0.3deg', kind: 'Heritage', title: 'Venue / Host', body: 'Have a 300-year-old stepwell, private Nizam-era courtyard, or historic acoustic sanctuary? Host a session.', href: '/apply/venue-host' },
];

// A wire paper clip holding each dossier's photograph.
const PaperClip = ({ className = '' }) => (
  <svg viewBox="0 0 16 44" className={className} aria-hidden="true">
    <path d="M5 40 V9 a4 4 0 0 1 8 0 v26 a6 6 0 0 1 -12 0 V12" fill="none" stroke="#7d7a70" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// 05 — CREW & 06 — BUILD THIS WORLD TOGETHER. Muted olive field; the
// dossier files are the visual focus.
export const Volunteer = () => {
  const { playSFX } = useAudio();
  const [openDetails, setOpenDetails] = useState(null);
  const sectionRef = useReveal();
  const collabRef = useReveal();

  return (
    <>
    <section ref={sectionRef} id="volunteer" className="t-section theme-crew overflow-hidden">
      <div className="t-container relative">
        <header className="max-w-3xl">
          <p className="reveal t-label sec-accent m-0">05 — Tangy Sessions // Recruitment archive</p>
          <h2 className="reveal-type t-h1 registrationOffset text-[#EFE2C0] mt-4 mb-0"><span className="rt">Join the crew</span></h2>
          <p className="reveal d2 t-quote text-[#EFE2C0]/90 mt-5 mb-0">&ldquo;Great experiences are built by passionate people behind the scenes.&rdquo;</p>
          <p className="reveal d2 t-label text-[#EFE2C0]/70 mt-4 mb-0">Behind the sound · On the stage</p>
        </header>

        {/* DOSSIERS — physical files on the desk */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-8 lg:gap-12 mt-20">
          {DOSSIERS.map((d, i) => (
            <article
              key={d.key}
              className="reveal-paper paperLift relative bg-[#f2e7cb] paperTexture paperShadow text-[#181614] p-6 md:p-8 lg:p-10 flex flex-col"
              style={{ '--rest-rot': d.rot, transitionDelay: `${330 + i * 140}ms` }}
            >
              <div className={`documentTab ${d.tabTone}`}>{d.tab}</div>

              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-3 pb-3 border-b border-[#181614]/40">
                <p className="archiveMetadata text-[#181614]/70 m-0 pt-1">{d.path}</p>
                <span className={`reveal-stamp archiveStamp shrink-0 ${d.stampTone}`} style={{ '--rest-rot': '-5deg' }}>{d.stamp}</span>
              </div>
              <h3 className="t-h2 font-display font-normal mt-6 mb-0">{d.title}</h3>
              <p className="t-body text-[#181614]/85 mt-4 mb-0 max-w-[40ch]">{d.note}</p>

              <figure className="relative m-0 mt-7 w-[200px] md:w-[220px] photoFrame paperShadow -rotate-[2deg]">
                <PaperClip className="absolute -top-4 left-5 w-4 h-11 z-[3]" />
                <div className="photoFrame-img">
                  <picture>
                    <source srcSet={d.photo.webp} type="image/webp" />
                    <img src={d.photo.src} alt={d.photo.alt} loading="lazy" decoding="async" className="photo-aged block w-full aspect-[4/3] object-cover" />
                  </picture>
                </div>
                <figcaption className="filmCaption mt-2 text-[#181614]/75">{d.photo.caption}</figcaption>
              </figure>

              <ul className="list-none m-0 p-0 mt-6 flex flex-wrap gap-2">
                {d.tags.map((t) => (
                  <li key={t} className="archiveMetadata border border-[#181614]/60 px-2 py-1">{t}</li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setOpenDetails(openDetails === d.key ? null : d.key)}
                aria-expanded={openDetails === d.key}
                className="t-link self-start mt-6 text-[#181614]/80 hover:text-[#B5532A] min-h-[44px]"
              >
                {openDetails === d.key ? 'Hide details −' : 'Details +'}
              </button>
              {openDetails === d.key && (
                <div className="t-small border-l-2 border-[#B5532A] pl-3 mt-1 mb-2">
                  <p className="archiveMetadata m-0 mb-1">{d.detailsTitle}</p>
                  {d.details.map((line) => <p key={line} className="m-0">• {line}</p>)}
                </div>
              )}

              <div className="mt-auto pt-6">
                <a href={d.cta.href} onClick={() => playSFX('ticketClick')} className="t-btn w-full">
                  {d.cta.label}
                </a>
              </div>
            </article>
          ))}
        </div>

        <p className="folio text-right mt-14 mb-0" aria-hidden="true">— 05 —</p>
      </div>
    </section>

    {/* 06 — BUILD THIS WORLD TOGETHER: partner files in a botanical-print archive */}
    <section ref={collabRef} id="build-together" className="t-section theme-collab overflow-hidden">
      <div className="t-container relative">
        <header className="t-grid items-end gap-y-4 pb-8 border-b-[3px] border-double border-[#EFE2C0]/25">
          <div className="col-span-4 md:col-span-5 lg:col-span-8">
            <p className="reveal t-label sec-accent m-0">06 — Collaboration archive // Tangy Sessions</p>
            <h2 className="reveal-type t-h2 registrationOffset text-[#EFE2C0] mt-4 mb-0"><span className="rt">Build this world together</span></h2>
          </div>
          <p className="reveal d2 t-quote text-[#EFE2C0]/85 m-0 col-span-4 md:col-span-3 lg:col-span-4">
            &ldquo;Artists, venues, partners and dreamers have always shaped Tangy.&rdquo;
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 mt-12">
          {PARTNERS.map((p, i) => (
            <article
              key={p.no}
              className="reveal-paper paperLift bg-[#f2e7cb] paperTexture paperShadow text-[#181614] flex flex-col"
              style={{ '--rest-rot': p.rot, transitionDelay: `${330 + i * 110}ms` }}
            >
              {/* File label band */}
              <div className="flex justify-between items-center px-6 lg:px-8 py-2.5 archiveMetadata" style={{ background: p.band, color: p.bandInk }}>
                <span>File No. {p.no}</span>
                <span>{p.kind}</span>
              </div>
              <div className="flex-1 flex flex-col p-6 lg:p-8">
                <h3 className="t-h3 m-0">{p.title}</h3>
                <p className="t-small text-[#181614]/85 mt-3 mb-6">{p.body}</p>
                <a href={p.href} className="t-btn mt-auto">Collaborate → Explore opportunities</a>
              </div>
            </article>
          ))}
        </div>

        <p className="folio text-right mt-14 mb-0" aria-hidden="true">— 06 —</p>
      </div>
    </section>
    </>
  );
};
