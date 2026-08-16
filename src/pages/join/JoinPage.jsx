import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';
import { ROLE_META } from '../../services/authService';

const ROLE_ICONS = {
  patron: '🎫', artist: '🎤', vendor: '🍵', crew: '🎬',
  volunteer: '🤝', sponsor: '✦', venue: '🏛️', private: '💌',
};

export const JoinPage = () => {
  const navigate = useNavigate();
  const { signUp, ROLE_META: roles } = useMockAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = signUp({ ...form, role: selectedRole });
    setSubmitting(false);
    if (!res.success) { setError(res.error); return; }
    navigate(roles[selectedRole].dashboard);
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.06] mix-blend-overlay pointer-events-none" />
        <div className="relative z-10">
          <span className="font-mono text-[10px] sm:text-xs text-[#C99A2E] tracking-[0.35em] uppercase font-bold mb-3 block">
            TANGY SESSIONS // MEMBERSHIP DESK
          </span>
          <h1 className="display text-4xl sm:text-7xl text-[#E7D5A4] leading-tight sm:leading-none ink-bleed uppercase mb-4">
            CREATE YOUR<br />TANGY PROFILE
          </h1>
          {!selectedRole && (
            <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed border-y border-[#C99A2E]/30 py-3 sm:py-4 uppercase">
              CHOOSE YOUR PATH INTO THE TANGY WORLD.
            </p>
          )}
        </div>
      </section>

      {!selectedRole ? (
        <section className="pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Object.entries(roles).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setSelectedRole(key)}
                className="text-left bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-5 shadow-[6px_6px_0px_#11100C] hover:-translate-y-1 transition-transform flex flex-col gap-2"
              >
                <span className="text-3xl">{ROLE_ICONS[key]}</span>
                <h3 className="font-display text-xl font-bold uppercase leading-tight">{meta.label}</h3>
                <p className="font-mono text-[11px] text-[#11100C]/70 leading-relaxed">{meta.tagline}</p>
                <span className="mt-2 font-mono text-[10px] font-bold text-[#B94717] uppercase">SELECT →</span>
              </button>
            ))}
          </div>
          <div className="text-center mt-10 font-mono text-xs text-[#E7D5A4]/60">
            Already have a Tangy profile? <button onClick={() => navigate('/join/login')} className="text-[#C99A2E] underline font-bold">SIGN IN →</button>
          </div>
        </section>
      ) : (
        <section className="pb-20 px-4 sm:px-6 max-w-lg mx-auto">
          <div className="bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 sm:p-10 shadow-[10px_10px_0px_#11100C]">
            <div className="flex justify-between items-center border-b-2 border-[#11100C] pb-3 mb-6">
              <div>
                <span className="font-mono text-[9px] font-bold text-[#B94717] uppercase tracking-widest">{ROLE_ICONS[selectedRole]} {roles[selectedRole].label}</span>
                <h2 className="font-display text-2xl font-bold uppercase">SET UP YOUR ACCOUNT</h2>
              </div>
              <button onClick={() => setSelectedRole(null)} className="font-mono text-[10px] font-bold underline">CHANGE</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Full Name / Organization</label>
                <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase mb-1">Password</label>
                <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full p-3 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
              </div>

              {error && <div className="p-3 bg-[#B94717] text-[#E7D5A4] font-bold border-2 border-[#11100C]">{error}</div>}

              <div className="p-2 bg-[#11100C]/5 border border-[#11100C]/20 text-[9px] text-[#11100C]/70">
                ℹ️ MOCK ACCOUNT — for previewing the {roles[selectedRole].label.toLowerCase()} experience. Not a real login; no email verification is sent.
              </div>

              <button type="submit" disabled={submitting} className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C] disabled:opacity-50">
                {submitting ? 'CREATING...' : 'CREATE PROFILE →'}
              </button>
            </form>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};
