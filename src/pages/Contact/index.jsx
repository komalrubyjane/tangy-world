import { PostcardContactModal } from '../../components/museum/PostcardContactModal';

export const ContactPage = () => {
  return (
    <div className="w-full min-h-screen bg-[#e9decb] text-[#241a12] pt-20 pb-28 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8 text-left">
        
        {/* HEADER */}
        <div className="border-b-4 border-[#191410] pb-4">
          <span className="font-mono text-xs font-bold text-[#c2272a] tracking-[0.3em] uppercase">11 CORRESPONDENCE DESK // MAILBOX</span>
          <h1 className="font-poster text-4xl sm:text-6xl text-[#191410] uppercase my-2">POSTCARD CONTACT</h1>
          <p className="font-mono text-sm text-[#241a12]/80">SEND US A LETTER, INQUIRY, OR ACOUSTIC COLLABORATION IDEA</p>
        </div>

        {/* EMBEDDED POSTCARD FORM */}
        <PostcardContactModal isOpen={true} onClose={() => {}} />

      </div>
    </div>
  );
};
