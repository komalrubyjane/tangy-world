import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useAudio } from '../../audio/AudioContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();
  const { playSFX } = useAudio();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('PLEASE FILL IN ALL REQUIRED CREDENTIALS');
      return;
    }
    setError('');
    playSFX('ticketClick');
    const result = await login(email, password);
    if (result.ok) {
      navigate('/artist/dashboard');
    } else {
      setError(result.error || 'AUTHENTICATION FAILED. PLEASE TRY AGAIN.');
    }
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
            <span className="font-mono text-[9px] font-bold text-[#c2272a] tracking-widest uppercase">PORTAL CREDENTIALS</span>
            <h2 className="font-poster text-3xl text-[#241a12] my-1">SIGN IN TO PORTAL</h2>
            <p className="font-mono text-xs text-[#241a12]/70">Enter your registered artist account details below.</p>
          </div>

          {error && (
            <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410]">
              ✕ {error}
            </div>
          )}

          {resetSent && (
            <div className="p-3 bg-[#2e6834] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410]">
              ✓ PASSWORD RESET LINK SENT — CHECK YOUR EMAIL.
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">EMAIL ADDRESS *</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="artist@example.com"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/50 outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">PASSWORD *</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/50 outline-none"
              />
            </div>

            <div className="flex justify-between items-center font-mono text-[10px]">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  className="accent-[#c2272a]"
                />
                <span>REMEMBER ME</span>
              </label>

              <button
                type="button"
                onClick={async () => {
                  if (!email) {
                    setError('Enter your email above first, then tap Forgot Password.');
                    return;
                  }
                  playSFX('ticketClick');
                  const res = await authService.requestPasswordReset(email);
                  if (res.success) {
                    setError('');
                    setResetSent(true);
                  } else {
                    setError(res.error || 'Could not send reset email.');
                  }
                }}
                className="text-[#c2272a] underline font-bold"
              >
                FORGOT PASSWORD?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all mt-2"
            >
              {loading ? 'AUTHENTICATING...' : 'ENTER ARTIST PORTAL →'}
            </button>
          </form>

          <div className="border-t border-[#191410]/20 pt-4 text-center font-mono text-xs">
            <span className="text-[#241a12]/70">NEW ARTIST? </span>
            <button 
              onClick={() => { playSFX('ticketClick'); navigate('/artist/register'); }}
              className="text-[#c2272a] font-bold underline ml-1 uppercase"
            >
              APPLY AS ARTIST →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
