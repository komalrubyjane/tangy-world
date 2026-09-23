import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAudio } from '../../audio/AudioContext';
import { EmailOtpAuth } from '../../components/auth/EmailOtpAuth';
// DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note.
import { DEMO_ADMIN_ENABLED } from '../../config/demoAdmin';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();
  const [error, setError] = useState('');

  // After a real Supabase OTP verification, check whether this account has
  // an artist application on file (src/artist/contexts/AuthContext.jsx's
  // own onAuthStateChange listener will also pick up the new session and
  // load the same row in the background) — Artist Portal access is gated
  // by the existence of an `artists` row, never by profiles.role. Anyone
  // can verify their email; only an applicant reaches the portal.
  const handleVerified = async ({ user }) => {
    playSFX('ticketClick');
    const artistRow = await authService.getArtistByUserId(user.id);
    if (!artistRow) {
      setError('This account has no artist application on file. Apply as an artist below, or sign in with your artist account.');
      return;
    }
    navigate('/artist/dashboard');
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-4xl bg-[#e9decb] text-[#241a12] border-4 border-[#191410] shadow-[14px_14px_0px_#4c1210] grid grid-cols-1 md:grid-cols-2 overflow-hidden text-left">

        {/* LEFT PANEL: PORTAL OVERVIEW & CHECKLIST */}
        <div className="bg-[#191410] text-[#ecdcaf] p-8 border-b-4 md:border-b-0 md:border-r-4 border-[#191410] flex flex-col justify-between">
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[9px] font-bold text-[#d1a437] tracking-[0.3em] uppercase">
              ARTIST PORTAL // ACCESS CONTROL
            </span>
            <h1 className="font-poster text-4xl text-[#ecdcaf] leading-none">
              YOUR STAGE AWAITS.
            </h1>
            <p className="font-mono text-xs text-[#ecdcaf]/80 leading-relaxed">
              Manage your artist identity, performance schedules, and media uploads inside Hyderabad's heritage sanctuaries.
            </p>

            <div className="flex flex-col gap-2.5 my-4 border-t border-[#ecdcaf]/15 pt-4 font-mono text-[10px] text-[#ecdcaf]/90">
              <div className="flex items-center gap-2">
                <span className="text-[#d1a437]">✓</span>
                <span>SECURE ARTIST AUTHENTICATION</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d1a437]">✓</span>
                <span>AVAILABILITY CALENDAR & SCHEDULING</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d1a437]">✓</span>
                <span>AUDIO & VIDEO DEMO UPLOADS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#d1a437]">✓</span>
                <span>SESSION INVITATIONS & INQUIRIES</span>
              </div>
            </div>
          </div>

          <div className="font-mono text-[8.5px] text-[#ecdcaf]/50 uppercase border-t border-[#ecdcaf]/15 pt-3">
            TANGY SESSIONS // EST. 2016 // BANSILAL STEPWELL
          </div>
        </div>

        {/* RIGHT PANEL: LOGIN FORM */}
        <div className="p-8 flex flex-col justify-between gap-6">
          <div>
            <button
              type="button"
              onClick={() => navigate('/join')}
              className="mb-3 font-mono text-[9px] font-bold text-[#241a12]/50 hover:text-[#c2272a] uppercase tracking-wider"
            >
              ← CHANGE HOW YOU'RE JOINING
            </button>
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest uppercase">PORTAL CREDENTIALS</span>
            <h2 className="font-poster text-3xl text-[#241a12] my-1">SIGN IN TO PORTAL</h2>
            <p className="font-mono text-xs text-[#241a12]/70">No password needed — verify with a one-time code sent to your email.</p>
          </div>

          {error && (
            <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410]">
              ✕ {error}
            </div>
          )}

          <EmailOtpAuth
            copy={{ emailIntro: 'Enter your registered artist email — we\'ll send a one-time verification code.' }}
            onVerified={handleVerified}
          />

          <div className="border-t border-[#191410]/20 pt-4 text-center font-mono text-xs">
            <span className="text-[#241a12]/70">NEW ARTIST? </span>
            <button
              onClick={() => { playSFX('ticketClick'); navigate('/artist/register'); }}
              className="text-[#c2272a] font-bold underline ml-1 uppercase"
            >
              APPLY AS ARTIST →
            </button>
          </div>

          {/* DEMO-ONLY CODE — see src/config/demoAdmin.js for the deletion note. */}
          {DEMO_ADMIN_ENABLED && (
            <button
              type="button"
              onClick={() => navigate('/demo/artist')}
              className="w-full text-left font-mono text-[9px] bg-transparent hover:bg-[#191410]/5 p-2.5 border border-dashed border-[#191410]/30 transition-colors"
            >
              <span className="font-bold uppercase tracking-wider text-[#241a12]/70">TEAM DEMO</span>
              <span className="text-[#241a12]/50"> — internal preview access, not a real account →</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
