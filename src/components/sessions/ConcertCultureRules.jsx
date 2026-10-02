// The three concert-culture rules (/sessions/concert-culture). Previously
// copied into both SessionsPage and ConcertCulturePage.
const CONCERT_RULES = [
  { title: 'UNAMPLIFIED ACOUSTICS', desc: 'No loud artificial speakers. We collaborate with ancient limestone walls that naturally carry the sound for seconds.' },
  { title: 'NO PHONES IN THE AIR', desc: 'We ask all attendees to put away screens during performances. Be completely present in the physical room.' },
  { title: 'COLLECTIBLE TICKETS', desc: 'Every ticket is a physical hand-screenprinted artefact on 300gsm cotton paper for your archive.' },
];

export const ConcertCultureRules = () => (
  <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
    {CONCERT_RULES.map((c, i) => (
      <div key={c.title} className="bg-[#211915] border-2 border-[#C99A2E]/40 p-6 sm:p-8">
        <span className="font-mono text-xs font-bold text-[#C99A2E] block mb-2">RULE #0{i + 1}</span>
        <h2 className="display text-2xl sm:text-3xl text-[#E7D5A4] mb-2">{c.title}</h2>
        <p className="font-mono text-xs text-[#E7D5A4]/75 leading-relaxed">{c.desc}</p>
      </div>
    ))}
  </div>
);
