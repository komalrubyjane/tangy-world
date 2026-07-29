import { Manifesto } from '../../components/sections/Manifesto';
import { PageTransition } from '../../components/ui/PageTransition';

export default function ManifestoPage() {
  return (
    <PageTransition>
      <div className="w-full min-h-screen bg-[#ecdcaf] text-[#191410] pt-20 pb-24 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-10">
          <div className="border-b-4 border-[#191410] pb-4 text-left">
            <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em] uppercase">01 MANIFESTO EDITION</span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#191410] uppercase my-2">AN INTERACTIVE MUSIC ARCHIVE</h1>
            <p className="font-mono text-sm text-[#191410]/80">HYDERABAD · EST. 2016 · PRESERVING THE TANGIBLE SOUND</p>
          </div>

          <Manifesto />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left border-t-2 border-[#191410] pt-8">
            <div className="bg-[#191410] text-[#ecdcaf] p-6 border-2 border-[#191410] shadow-[6px_6px_0px_#c2272a]">
              <h3 className="font-poster text-2xl text-[#d1a437] uppercase mb-2">OUR SOUND PHILOSOPHY</h3>
              <p className="font-sans text-sm opacity-90 leading-relaxed">
                We do not build stages. We listen to the architecture. Every stepwell, courtyard, and hill pavilion possesses a natural acoustic reverb signature that no digital plugin can replicate.
              </p>
            </div>

            <div className="bg-[#191410] text-[#ecdcaf] p-6 border-2 border-[#191410] shadow-[6px_6px_0px_#315D73]">
              <h3 className="font-poster text-2xl text-[#ecdcaf] uppercase mb-2">HERITAGE PRESERVATION</h3>
              <p className="font-sans text-sm opacity-90 leading-relaxed">
                Music is our tool for architectural restoration. By holding intimate acoustic sessions inside ancient monuments, we reconnect people with forgotten historical sanctuaries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
