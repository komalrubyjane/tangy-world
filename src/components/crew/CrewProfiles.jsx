import { crewByTeam, initials } from '../../data/demo/crewProfiles';

// Crew profiles for /crew/production and /crew/stage-operations (demo data —
// see src/data/demo/crewProfiles.js). Monogram portraits, no photos.
export const CrewProfiles = ({ team, title }) => (
  <section aria-labelledby={`crew-${team}`} className="mb-12">
    <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
      <h2 id={`crew-${team}`} className="font-poster text-3xl text-[#ecdcaf] m-0">{title}</h2>
      <span className="font-mono text-[10px] uppercase tracking-widest text-[#ecdcaf]/70">Demo profiles</span>
    </div>
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none m-0 p-0">
      {crewByTeam(team).map((c) => (
        <li key={c.name} className="bg-[#181614] border-2 border-[#ecdcaf]/40 p-5 shadow-[4px_4px_0px_#191410] flex gap-4" data-crew-profile>
          <span aria-hidden="true" className="shrink-0 w-14 h-14 rounded-full border-2 border-[#d1a437] flex items-center justify-center font-poster text-xl text-[#d1a437]">{initials(c.name)}</span>
          <div className="min-w-0">
            <h3 className="font-poster text-xl text-[#ecdcaf] m-0">{c.name}</h3>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#d1a437] m-0">{c.role}</p>
            <p className="font-mono text-xs text-[#ecdcaf]/80 mt-2 mb-2">{c.bio}</p>
            <ul className="flex flex-wrap gap-1.5 list-none m-0 p-0" aria-label={`${c.name}'s responsibilities`}>
              {c.responsibilities.map((r) => <li key={r} className="font-mono text-[9px] uppercase border border-[#ecdcaf]/30 px-2 py-0.5">{r}</li>)}
            </ul>
          </div>
        </li>
      ))}
    </ul>
  </section>
);
