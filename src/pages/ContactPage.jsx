import { useNavigate } from 'react';
import { motion } from 'framer-motion';
import { PostcardContactModal } from '../components/museum/PostcardContactModal';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const ContactPage = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-screen bg-[#3c0f0e] text-[#ecdcaf] pt-16 pb-20 select-none text-left"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <div className="fixed inset-0 pointer-events-none z-[80] shadow-[inset_0_0_140px_rgba(0,0,0,0.85)]" />

      <Navbar onOpenProgramme={() => navigate('/programme')} />

      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* POSTCARD MODAL DIRECTLY EMBEDDED IN PAGE */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-8 shadow-[12px_12px_0px_#4c1210] mb-12">
          <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase block mb-2">
            CORRESPONDENCE DESK // MAILBOX
          </span>
          <h1 className="font-poster text-4xl sm:text-5xl text-[#ecdcaf] leading-none my-1">
            SEND US A POSTCARD
          </h1>
          <p className="font-mono text-xs text-[#d1a437] mb-6">
            INQUIRIES, GENERAL DISPATCH, AND HERITAGE SESSION SUGGESTIONS.
          </p>

          <div className="relative">
            <PostcardContactModal isOpen={true} onClose={() => navigate('/')} />
          </div>
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
