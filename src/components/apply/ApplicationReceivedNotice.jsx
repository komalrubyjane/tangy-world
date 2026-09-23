import { useNavigate } from 'react-router-dom';

// Post-submission confirmation shown in each apply page's `submitted`
// branch — the fuller status screen the spec asks for, in place of a bare
// "thanks" message. `statusRoute` is that role's own dashboard route, which
// (until approved) already renders the pending-application view — see the
// isApproved gating built into each role dashboard (src/pages/dashboards/*)
// and RoleApplicationDashboard.jsx. No new "status page" was built; this
// just routes to the existing one.
export const ApplicationReceivedNotice = ({ roleLabel, statusRoute }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-black/10 border-2 border-current p-8 text-center flex flex-col items-center gap-3">
      <h3 className="display text-3xl sm:text-4xl uppercase">APPLICATION RECEIVED</h3>
      <p className="font-mono text-xs font-bold uppercase tracking-widest opacity-80">{roleLabel} Application</p>
      <span className="px-3 py-1 border-2 border-current font-mono text-[10px] font-bold uppercase tracking-widest">
        STATUS: PENDING REVIEW
      </span>
      <p className="font-mono text-xs opacity-80 max-w-md">
        Your application has been submitted successfully. The Tangy team will review it — we'll email you the moment
        there's an update.
      </p>
      {statusRoute && (
        <button
          type="button"
          onClick={() => navigate(statusRoute)}
          className="mt-2 px-5 py-3 bg-current text-[#11100C] font-mono text-xs font-bold uppercase tracking-widest"
        >
          VIEW APPLICATION STATUS →
        </button>
      )}
    </div>
  );
};
