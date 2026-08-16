import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { useMockAuth } from '../../context/MockAuthContext';
import { agentService } from '../../services/agentService';

const STATUS_COLORS = {
  pending: 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40',
  assigned: 'bg-[#8b5cf6]/20 text-[#8b5cf6] border-[#8b5cf6]/40',
  active: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  resolved: 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/40',
  closed: 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30',
};

const Badge = ({ status }) => (
  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase border ${STATUS_COLORS[status] || 'bg-[#E7D5A4]/10 text-[#E7D5A4] border-[#E7D5A4]/30'}`}>
    {status}
  </span>
);

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

const Empty = ({ children }) => (
  <div className="p-8 text-center font-mono text-[11px] font-bold text-[#E7D5A4]/50 border-2 border-dashed border-[#C99A2E]/30">{children}</div>
);

const CATEGORIES = [
  {
    id: 'Private Events',
    icon: '🎉',
    desc: 'An intimate stone courtyard set for birthdays, anniversaries and milestone gatherings — full production, scaled down.',
  },
  {
    id: 'Corporate Events',
    icon: '🏢',
    desc: 'Offsites and brand gatherings staged inside 300-year-old acoustics — a genuinely different kind of corporate evening.',
  },
  {
    id: 'Weddings',
    icon: '💍',
    desc: 'Sangeet nights and mehndi evenings scored live and unamplified, inside a heritage stepwell or haveli.',
  },
  {
    id: 'Heritage Experiences',
    icon: '🏺',
    desc: 'Guided listening walks and archive exhibitions for smaller private groups who want the story behind the sound.',
  },
];

export const PrivateDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useMockAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [form, setForm] = useState({ eventDate: '', guestCount: '', notes: '' });
  const [confirmedId, setConfirmedId] = useState(null);

  useEffect(() => { setLoading(false); }, []);

  const myEnquiries = agentService.getAll().filter((r) => r.user.toLowerCase() === user.fullName.toLowerCase());

  const handleLogout = () => { signOut(); navigate('/'); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCategory) return;
    const question = `${selectedCategory} enquiry — ${form.guestCount || '—'} guests, preferred date ${form.eventDate || 'flexible'}. ${form.notes || ''}`.trim();
    const req = agentService.create({ user: user.fullName, role: 'private', category: selectedCategory, question });
    setConfirmedId(req.id);
    setForm({ eventDate: '', guestCount: '', notes: '' });
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-[#11100C] text-[#E7D5A4] font-mono selection:bg-[#C99A2E] selection:text-[#11100C] overflow-x-hidden">
      <Navbar />

      <section className="pt-24 sm:pt-32 pb-10 px-4 sm:px-6 max-w-5xl mx-auto text-center border-b-2 border-[#C99A2E]/40">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="text-left">
            <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase tracking-widest block">PRIVATE & CORPORATE DESK</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold uppercase">{user.fullName}</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link to="/ai" className="border border-[#C99A2E]/60 text-[#E7D5A4] hover:bg-[#C99A2E]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">✦ ASK TANGY AI</Link>
            <button onClick={handleLogout} className="bg-[#B94717] text-[#E7D5A4] hover:bg-[#11100C] border border-[#B94717] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">LOG OUT ✕</button>
          </div>
        </div>
        <h2 className="font-display text-3xl sm:text-5xl text-[#E7D5A4] leading-tight uppercase mb-4">
          PLAN A PRIVATE<br className="sm:hidden" /> TANGY EXPERIENCE
        </h2>
        <p className="font-mono text-xs sm:text-sm text-[#E7D5A4]/80 tracking-widest max-w-2xl mx-auto leading-relaxed">
          CHOOSE A CATEGORY BELOW TO START AN ENQUIRY WITH OUR CURATION DESK.
        </p>
      </section>

      <section className="px-4 sm:px-6 max-w-6xl mx-auto py-10">
        {loading ? (
          <div className="p-10 text-center font-mono text-xs font-bold text-[#E7D5A4]/50">LOADING PRIVATE DESK...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id === selectedCategory ? null : c.id)}
                  className={`text-left border-4 p-5 shadow-[6px_6px_0px_#11100C] transition-transform hover:-translate-y-1 flex flex-col gap-2 ${
                    selectedCategory === c.id ? 'bg-[#C99A2E] border-[#11100C] text-[#11100C]' : 'bg-[#E7D5A4] border-[#11100C] text-[#11100C]'
                  }`}
                >
                  <span className="text-3xl">{c.icon}</span>
                  <h3 className="font-display text-lg font-bold uppercase leading-tight">{c.id}</h3>
                  <p className="font-mono text-[10px] leading-relaxed opacity-80">{c.desc}</p>
                  <span className="mt-1 font-mono text-[10px] font-bold text-[#B94717] uppercase">{selectedCategory === c.id ? 'SELECTED ✓' : 'SELECT →'}</span>
                </button>
              ))}
            </div>

            {selectedCategory && (
              <div className="max-w-lg mx-auto mb-12 bg-[#E7D5A4] text-[#11100C] border-4 border-[#11100C] p-6 shadow-[8px_8px_0px_#11100C]">
                <h3 className="font-display text-lg font-bold uppercase mb-1">{selectedCategory} Enquiry</h3>
                <p className="font-mono text-[10px] text-[#11100C]/60 mb-4">Tell us roughly what you have in mind — a member of the team will follow up.</p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Preferred Date</label>
                    <input type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Approx. Guest Count</label>
                    <input value={form.guestCount} onChange={(e) => setForm({ ...form, guestCount: e.target.value })} placeholder="e.g. 60" className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase mb-1">Notes</label>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything else we should know?" className="w-full p-2 bg-[#F5E9C9] border-2 border-[#11100C] outline-none h-20" />
                  </div>
                  <button type="submit" className="py-3 bg-[#11100C] text-[#E7D5A4] hover:bg-[#B94717] font-bold uppercase tracking-widest border-2 border-[#11100C]">SUBMIT ENQUIRY →</button>
                </form>
              </div>
            )}

            {confirmedId && (
              <div className="max-w-lg mx-auto mb-12 p-4 bg-[#10b981]/20 border-2 border-[#10b981]/40 text-center font-mono text-xs font-bold">
                ✓ ENQUIRY SENT — REF {confirmedId}. THE TANGY TEAM WILL REACH OUT SOON.
              </div>
            )}

            <div className="border-t-2 border-[#C99A2E]/40 pt-8">
              <h3 className="font-display text-xl font-bold uppercase mb-4">Request History</h3>
              {myEnquiries.length === 0 ? (
                <Empty>NO ENQUIRIES FILED YET — SELECT A CATEGORY ABOVE TO START YOUR FIRST ONE.</Empty>
              ) : (
                <div className="flex flex-col gap-3">
                  {myEnquiries.map((r) => (
                    <div key={r.id} className="bg-[#191410] border-2 border-[#C99A2E]/30 p-4 flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                      <div>
                        <span className="font-mono text-[9px] font-bold text-[#C99A2E] uppercase">{r.category} · {fmtDateTime(r.createdAt)}</span>
                        <p className="font-mono text-xs mt-1">{r.question}</p>
                      </div>
                      <Badge status={r.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12 max-w-lg bg-[#191410] border-2 border-[#C99A2E]/40 p-5">
              <h3 className="font-display text-lg font-bold uppercase mb-2">Need help?</h3>
              <p className="font-mono text-[11px] text-[#E7D5A4]/70 mb-3">Ask Tangy AI about pricing ranges, venue options, or what a private booking includes.</p>
              <Link to="/ai" className="inline-block px-4 py-2 bg-[#C99A2E] text-[#11100C] font-bold uppercase text-[10px] tracking-widest">✦ ASK TANGY AI →</Link>
            </div>
          </>
        )}
      </section>

      <Footer />
    </div>
  );
};
