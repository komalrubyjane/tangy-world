import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';

export const JoinLoginPage = () => {
  const navigate = useNavigate();
  const { signIn, ROLE_META } = useMockAuth();
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
    navigate(ROLE_META[res.user.role]?.dashboard || '/join');
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono overflow-x-hidden">
      <Navbar />
      <section className="pt-28 pb-20 px-4 sm:px-6 max-w-md mx-auto">
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
      </section>
      <Footer />
    </div>
  );
};
