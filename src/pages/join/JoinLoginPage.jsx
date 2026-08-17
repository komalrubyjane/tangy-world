import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';
import { DEV_ACCOUNT_LIST } from '../../services/mockAuthService';

export const JoinLoginPage = () => {
  const navigate = useNavigate();
  const { signIn, DASHBOARD_BY_ROLE } = useMockAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = signIn({ email, password });
    setSubmitting(false);
    if (!res.success) { setError(res.error); return; }
    navigate(DASHBOARD_BY_ROLE[res.user.role] || '/join');
  };

  const applyPreset = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-20 px-4 sm:px-6 max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-8 items-start">
        <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 sm:p-10 shadow-[10px_10px_0px_#11100C]">
          <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest">TANGY PROFILE // SIGN IN</span>
          <h1 className="font-display text-2xl font-bold uppercase mb-6 mt-1">WELCOME BACK</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase mb-1">Password</label>
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
            </div>
            {error && <div className="p-3 bg-[#B94717] text-[#E7D5A4] font-bold border-2 border-[#11100C]">{error}</div>}
            <button type="submit" disabled={submitting} className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C] disabled:opacity-50">
              {submitting ? 'SIGNING IN...' : 'SIGN IN →'}
            </button>
            <button type="button" onClick={() => navigate('/join')} className="text-center text-[10px] font-bold underline">
              NEW HERE? CREATE A PROFILE
            </button>
          </form>
        </div>

        <div className="bg-[#191410] border-2 border-[#C99A2E] p-5 sm:p-6 shadow-[8px_8px_0px_#11100C]">
          <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest block">TANGY SESSIONS — DEVELOPMENT ACCOUNT ACCESS</span>
          <h2 className="font-display text-lg font-bold uppercase mt-1 mb-1">DEVELOPMENT ACCOUNTS</h2>
          <p className="font-mono text-[10px] text-[#E7D5A4]/60 mb-4 leading-relaxed">
            Local-only demo accounts, not connected to Supabase. Click a card to fill the form, then press SIGN IN.
          </p>
          <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
            {DEV_ACCOUNT_LIST.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => applyPreset(account)}
                className="text-left border border-[#C99A2E]/50 hover:border-[#C99A2E] bg-[#11100C] hover:bg-[#C99A2E]/10 p-3 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-mono text-[10px] font-bold uppercase text-[#C99A2E]">{account.label}</div>
                  <div className="font-mono text-[10px] text-[#E7D5A4]/80 truncate">{account.email}</div>
                </div>
                <span className="shrink-0 px-2 py-1 border border-[#C99A2E]/60 text-[9px] font-bold uppercase tracking-wider text-[#E7D5A4]">[ USE ACCOUNT ]</span>
              </button>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};
