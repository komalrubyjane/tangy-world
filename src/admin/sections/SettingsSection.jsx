import { useUserAuth } from '../../context/UserAuthContext';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { AUTH_MODE } from '../../config/auth';

export const SettingsSection = () => {
  const { user, logout } = useUserAuth();

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">YOUR ACCOUNT</h3>
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex justify-between"><span className="opacity-60">Email</span><span className="font-bold">{user?.email}</span></div>
          <div className="flex justify-between"><span className="opacity-60">Role</span><span className="font-bold uppercase text-[#C99A2E]">{user?.role}</span></div>
          <div className="flex justify-between"><span className="opacity-60">Passport ID</span><span className="font-bold">{user?.passport_id || '—'}</span></div>
        </div>
        <button
          onClick={logout}
          className="mt-5 w-full py-2.5 bg-[#C2272A] text-white hover:bg-[#11100C] border border-[#C2272A] text-xs font-bold uppercase tracking-wider"
        >
          LOG OUT ✕
        </button>
      </div>

      <div className="bg-[#191410] border border-[#C99A2E]/60 p-6 rounded-sm">
        <h3 className="text-lg font-bold text-[#C99A2E] mb-4 border-b border-[#C99A2E]/30 pb-2">SYSTEM STATUS</h3>
        <div className="flex flex-col gap-3 text-xs">
          <div className="flex justify-between">
            <span className="opacity-60">Auth mode</span>
            <span className="font-bold uppercase">{AUTH_MODE}</span>
          </div>
          <div className="flex justify-between">
            <span className="opacity-60">Supabase connection</span>
            <span className={`font-bold uppercase ${isSupabaseConfigured ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {isSupabaseConfigured ? 'Connected' : 'Not configured'}
            </span>
          </div>
        </div>
        <p className="mt-4 text-[10px] text-[#E7D5A4]/50 leading-relaxed">
          Role changes, RLS policies and Razorpay/Resend credentials are managed outside this console — see supabase/README.md.
        </p>
      </div>
    </div>
  );
};
