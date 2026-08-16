import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';

const volunteerRoles = [
  { title: "PHOTOGRAPHY", icon: "📷", desc: "Capture 16mm film atmosphere, stage action, and intimate audience moments." },
  { title: "VIDEOGRAPHY", icon: "🎥", desc: "Document live performances and behind-the-scenes interviews." },
  { title: "BACKSTAGE & ARTIST CARE", icon: "🎙️", desc: "Manage artist greenrooms, acoustic instruments, and stage timelines." },
  { title: "PRODUCTION & SOUND", icon: "🎛️", desc: "Assist audio engineers with microphone placement and subwoofer rigs." },
  { title: "TICKETING & RECEPTION", icon: "🎟️", desc: "Welcome guests, hand out vintage screenprinted tickets, and stamp passports." },
  { title: "SOCIAL MEDIA & DISPATCH", icon: "📱", desc: "Broadcast live pop-up clues and real-time session dispatches." }
];

export const VolunteerOpportunitiesPage = () => {
  return (
    <div className="min-h-screen bg-[#8a2320] text-[#ecdcaf] font-mono selection:bg-[#ecdcaf] selection:text-[#8a2320] overflow-x-hidden pt-16 pb-20">
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar />

      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <a href="/crew" className="font-mono text-[10px] text-[#ecdcaf]/70 tracking-widest uppercase hover:text-[#ecdcaf] transition-colors">← BACK TO CREW</a>

        <div className="w-full bg-[#191410] border-4 border-[#ecdcaf] p-6 sm:p-8 shadow-[10px_10px_0px_#191410] my-6 text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">JOIN THE TANGY CREW // RECRUITMENT DESK</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">VOLUNTEER<br/>OPPORTUNITIES</h1>
          <p className="font-mono text-xs text-[#ecdcaf]/80 max-w-2xl">
            Six pathways into the crew that builds every Tangy Session behind the scenes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
          {volunteerRoles.map((role, idx) => (
            <div key={idx} className="bg-[#ecdcaf] text-[#191410] p-5 border-2 border-[#191410] shadow-[6px_6px_0px_#191410] flex flex-col text-left justify-between group hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl">{role.icon}</span>
                  <span className="font-mono text-[9px] font-bold text-[#c2272a]">ROLE #{idx + 1}</span>
                </div>
                <h3 className="font-poster text-xl text-[#191410] my-1">{role.title}</h3>
                <p className="font-mono text-xs text-[#191410]/80 leading-relaxed">{role.desc}</p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#191410]/20 font-mono text-[9px] font-bold text-[#c2272a]">✦ RECRUITING NOW</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="/crew/apply" className="inline-block px-6 py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase tracking-[0.2em] hover:bg-[#ecdcaf] hover:text-[#191410] border-2 border-[#ecdcaf] transition-colors shadow-[4px_4px_0px_#191410]">
            APPLY FOR A ROLE →
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};
