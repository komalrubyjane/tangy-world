import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { merchandiseStore } from '../data/mockData';
import { useAudio } from '../audio/AudioContext';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

export const StorePage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleAddToCart = (product) => {
    playSFX('ticketClick');
    setCart(prev => [...prev, product]);
    setIsCartOpen(true);
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseInt(item.price.replace(/[^\d]/g, '')) || 0), 0);

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

      {/* CART DRAWER OVERLAY */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[250] flex justify-end">
          <div onClick={() => setIsCartOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-md bg-[#191410] text-[#ecdcaf] border-l-4 border-[#d1a437] p-6 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-between items-center border-b border-[#ecdcaf]/20 pb-3">
                <span className="font-mono text-xs font-bold text-[#d1a437]">🛒 YOUR ARCHIVE BAG ({cart.length})</span>
                <button onClick={() => setIsCartOpen(false)} className="font-mono text-xs font-bold border border-[#ecdcaf] px-2 py-1">✕ CLOSE</button>
              </div>

              <div className="flex flex-col gap-3 my-4">
                {cart.length === 0 ? (
                  <p className="font-mono text-xs text-[#ecdcaf]/60 py-8 text-center">YOUR BAG IS EMPTY.</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="p-3 bg-[#0d0a07] border border-[#ecdcaf]/20 flex justify-between items-center">
                      <div>
                        <h4 className="font-poster text-sm text-[#ecdcaf]">{item.name}</h4>
                        <span className="font-mono text-[9px] text-[#d1a437]">{item.category}</span>
                      </div>
                      <span className="font-poster text-sm text-[#d1a437]">{item.price}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-[#ecdcaf]/20 pt-4 flex flex-col gap-3">
              <div className="flex justify-between font-mono text-sm font-bold text-[#d1a437]">
                <span>TOTAL AMOUNT</span>
                <span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={() => { playSFX('ticketClick'); alert('Order placed! Your merchandise dispatch will be shipped from Hyderabad.'); setCart([]); setIsCartOpen(false); }}
                className="w-full py-3 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform"
              >
                PROCEED TO CHECKOUT →
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* HERO */}
        <div className="w-full bg-[#191410] border-4 border-[#d1a437] p-8 shadow-[12px_12px_0px_#4c1210] mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#c2272a] tracking-[0.3em] uppercase">
              VINTAGE GENERAL STORE // MERCHANDISE
            </span>
            <h1 className="font-poster text-4xl sm:text-6xl text-[#ecdcaf] leading-none my-1">
              THE MERCH STORE
            </h1>
            <p className="font-mono text-xs sm:text-sm text-[#d1a437] max-w-2xl">
              LIMITED SCREENPRINTED POSTERS, AUDIOPHILE VINYL, VINTAGE TEES, CERAMIC CHAI MUGS & CANVAS TOTES.
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="px-6 py-3.5 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all text-nowrap"
          >
            VIEW CART ({cart.length}) 🛒
          </button>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {merchandiseStore.map((item) => (
            <div key={item.id} className="bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-4 shadow-[8px_8px_0px_#191410] flex flex-col justify-between">
              <div>
                <img src={item.image} alt={item.name} className="w-full aspect-[4/3] object-cover border-2 border-[#191410] mb-3" />
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase">{item.category}</span>
                <h3 className="font-poster text-xl text-[#191410] my-1">{item.name}</h3>
                <p className="font-sans text-xs text-[#241a12]/80">{item.description}</p>
              </div>

              <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#191410]/20">
                <span className="font-poster text-xl text-[#c2272a]">{item.price}</span>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="px-4 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-[10px] font-bold uppercase border border-[#191410] active:scale-95 transition-all"
                >
                  ADD TO BAG →
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>

      <Footer />
    </motion.div>
  );
};
