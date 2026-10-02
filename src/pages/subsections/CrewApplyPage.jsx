import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { Footer } from '../../components/layout/Footer';
import { CrewApplicationForm } from '../../components/crew/CrewApplicationForm';
import { ApplicationReceivedNotice } from '../../components/apply/ApplicationReceivedNotice';
import { PageCrumbs, SectionNav } from '../../components/layout/SectionNav';
import { usePageMeta } from '../../hooks/usePageMeta';

export const CrewApplyPage = () => {
  usePageMeta({ title: 'Crew Application', description: 'Apply to join the Tangy crew — photography, video, backstage, sound, reception and social.' });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#4A171D] text-[#ecdcaf] font-mono selection:bg-[#EFE2C0] selection:text-[#8a2320] overflow-x-hidden pt-16 pb-20 textileTexture">
      <Navbar />

      <main className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center gap-4 flex-wrap">
          <PageCrumbs className="[&_ol]:justify-start" />
          <button
            type="button"
            onClick={() => navigate('/join')}
            className="font-mono text-[10px] text-[#ecdcaf]/60 tracking-widest uppercase hover:text-[#ecdcaf] transition-colors"
          >
            ← CHANGE HOW YOU'RE JOINING
          </button>
        </div>

        <div className="mt-6 mb-8 text-left">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">CREW APPLICATION FORM</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf]">JOIN THE CREW</h1>
          <p className="font-mono text-xs text-[#ecdcaf]/80 mt-2 max-w-xl">
            Submit your application below and our crew desk will follow up within 48 hours.
          </p>
        </div>

        <div className="bg-[#181614] border-2 border-[#ecdcaf] p-6 sm:p-10 shadow-[4px_4px_0px_#191410] text-left">
          <CrewApplicationForm renderSuccess={() => <ApplicationReceivedNotice roleLabel="Crew" statusRoute="/crew/dashboard" />} />
        </div>
      </main>

      <SectionNav className="py-10 px-4" />

      <Footer />
    </div>
  );
};
