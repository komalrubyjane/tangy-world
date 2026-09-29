import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Panel, Skeleton } from '../../admin/ui';
import { workspaceApi } from '../services/workspaceApi';

// Real profile completion — computed server-side from 15 defined fields
// (artist_profile_completion in 0020). Lists exactly what is missing.
export const ProfileCompletionCard = () => {
  const [c, setC] = useState(undefined);
  useEffect(() => {
    let cancelled = false;
    workspaceApi.profileCompletion().then((r) => { if (!cancelled) setC(r); }, () => { if (!cancelled) setC(null); });
    return () => { cancelled = true; };
  }, []);
  if (c === undefined) return <Panel><Skeleton rows={2} /></Panel>;
  if (!c) return null;
  const missing = c.missing || [];
  return (
    <Panel title="Profile completion" subtitle={`${c.done} of ${c.total} details added`}>
      <div className="flex items-center gap-3 font-sans" data-profile-completion={c.percent}>
        <div className="flex-1 h-2 rounded-full bg-[#E7D5A4]/10 overflow-hidden" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion">
          <div className="h-full bg-[#C99A2E]" style={{ width: `${c.percent}%` }} />
        </div>
        <span className="font-condensed text-[22px] text-[#EFE2C0] tabular-nums">{c.percent}%</span>
      </div>
      {missing.length > 0 ? (
        <div className="mt-3 font-sans">
          <p className="text-[12.5px] text-[#E7D5A4]/60 mb-2">Add these so Tangy can book and brief you faster:</p>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((m) => (
              <li key={m}>
                <Link to={m === 'Media upload' ? '/artist/media' : m === 'Availability' ? '/artist/calendar' : '/artist/profile'}
                  className="inline-flex h-7 items-center px-2.5 rounded-full border border-[#C99A2E]/35 text-[12px] text-[#E7D5A4]/85 hover:bg-[#C99A2E]/10">+ {m}</Link>
              </li>
            ))}
          </ul>
        </div>
      ) : <p className="mt-2 text-[12.5px] text-[#5fd3a0] font-sans">Your profile is complete.</p>}
    </Panel>
  );
};
