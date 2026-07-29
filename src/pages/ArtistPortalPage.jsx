import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAudio } from '../audio/AudioContext';

export const ArtistPortalPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  // Auth State (Mocked with LocalStorage for Supabase readiness)
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [currentUser, setCurrentUser] = useState(null);
  
  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register Form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGenre, setRegGenre] = useState('Sufi & Contemporary');
  
  // Dashboard Tabs
  const [dashTab, setDashTab] = useState('profile'); // 'profile' | 'portfolio' | 'invites' | 'notifications' | 'settings'

  // Editable Profile State
  const [bio, setBio] = useState('Vocalist and composer exploring the intersection of Sufi ragas and modern ambient sub-bass textures.');
  const [location, setLocation] = useState('Hyderabad, Telangana');
  const [instruments, setInstruments] = useState('Vocals, Harmonium, Tanpura');
  const [instagram, setInstagram] = useState('@tangy.artist');
  const [spotify, setSpotify] = useState('https://spotify.com/artist/tangy');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Media Upload Stubs
  const [audioTracks, setAudioTracks] = useState([
    { id: 1, title: 'Stepwell Echoes (Live at 2 AM)', duration: '04:12', status: 'APPROVED' },
    { id: 2, title: 'Raag Bhairavi Acoustic Jam', duration: '03:45', status: 'UNDER REVIEW' }
  ]);

  useEffect(() => {
    const savedSession = localStorage.getItem('tangy_artist_session');
    if (savedSession) {
      try {
        setCurrentUser(JSON.parse(savedSession));
      } catch (err) {
        console.log(err);
      }
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;
    playSFX('ticketClick');
    const user = { name: loginEmail.split('@')[0].toUpperCase(), email: loginEmail, role: 'Residing Artist' };
    localStorage.setItem('tangy_artist_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;
    playSFX('ticketClick');
    const user = { name: regName, email: regEmail, role: 'Applicant Artist', genre: regGenre };
    localStorage.setItem('tangy_artist_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    playSFX('ticketClick');
    localStorage.removeItem('tangy_artist_session');
    setCurrentUser(null);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    playSFX('ticketClick');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddTrack = () => {
    playSFX('ticketClick');
    const newTrack = { id: Date.now(), title: `New Demo Recording #${audioTracks.length + 1}`, duration: '03:30', status: 'UNDER REVIEW' };
    setAudioTracks([...audioTracks, newTrack]);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full min-h-[100dvh] bg-[#191410] text-[#ecdcaf] font-sans antialiased overflow-x-hidden pt-16 pb-20 select-none"
    >
      <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
      <Navbar onOpenProgramme={() => navigate('/')} />

      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* TOP HERO BANNER */}
        <div className="w-full bg-[#8a2320] border-4 border-[#d1a437] p-6 shadow-[10px_10px_0px_#191410] mb-8 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="font-mono text-[10px] font-bold text-[#ecdcaf] tracking-[0.3em] uppercase">
              ARTIST PORTAL // SONIC ARCHIVE RECRUITMENT DESK
            </span>
            <h1 className="font-poster text-3xl sm:text-5xl text-[#ecdcaf] leading-none my-1">
              {currentUser ? `WELCOME, ${currentUser.name}` : 'TANGY ARTIST PORTAL'}
            </h1>
            <p className="font-mono text-xs text-[#ecdcaf]/80">
              Submit demos, manage session invitations, and curate your heritage performance profile.
            </p>
          </div>

          {currentUser && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold border border-[#ecdcaf] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
            >
              LOGOUT ➔
            </button>
          )}
        </div>

        {/* LOGGED OUT STATE: AUTHENTICATION PORTAL (LOGIN / REGISTER / FORGOT) */}
        {!currentUser ? (
          <div className="max-w-xl mx-auto bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-8 shadow-[12px_12px_0px_#8a2320] text-left flex flex-col gap-6">
            
            {/* AUTH TABS */}
            <div className="flex border-b-2 border-[#191410] pb-2 font-mono text-xs font-bold">
              <button 
                onClick={() => { playSFX('ticketClick'); setAuthTab('login'); }}
                className={`flex-1 py-2 text-center border-b-4 transition-all ${authTab === 'login' ? 'border-[#c2272a] text-[#c2272a]' : 'border-transparent text-[#241a12]/60 hover:text-[#191410]'}`}
              >
                ARTIST LOGIN
              </button>
              <button 
                onClick={() => { playSFX('ticketClick'); setAuthTab('register'); }}
                className={`flex-1 py-2 text-center border-b-4 transition-all ${authTab === 'register' ? 'border-[#c2272a] text-[#c2272a]' : 'border-transparent text-[#241a12]/60 hover:text-[#191410]'}`}
              >
                APPLY AS ARTIST
              </button>
            </div>

            {/* TAB 1: LOGIN */}
            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">PORTAL CREDENTIALS</span>
                
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="ARTIST EMAIL ADDRESS"
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <input 
                  type="password" 
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="PASSWORD"
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all"
                >
                  ENTER ARTIST PORTAL →
                </button>
              </form>
            )}

            {/* TAB 2: REGISTER */}
            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <span className="font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">ARTIST AUDITION APPLICATION</span>
                
                <input 
                  type="text" 
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="ARTIST / BAND STAGE NAME"
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <input 
                  type="email" 
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="EMAIL ADDRESS"
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <input 
                  type="password" 
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="CREATE PASSWORD"
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] placeholder:text-[#191410]/60 outline-none"
                />

                <select 
                  value={regGenre} 
                  onChange={(e) => setRegGenre(e.target.value)}
                  className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                >
                  <option value="Sufi & Contemporary">Sufi & Contemporary</option>
                  <option value="Carnatic Fusion">Carnatic Fusion</option>
                  <option value="Acoustic Folk">Acoustic Folk</option>
                  <option value="Deep Ambient">Deep Ambient</option>
                </select>

                <button 
                  type="submit" 
                  className="w-full py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#191410] active:scale-95 transition-all"
                >
                  SUBMIT AUDITION APPLICATION →
                </button>
              </form>
            )}

            <div className="font-mono text-[9px] text-[#241a12]/70 text-center pt-2 border-t border-[#191410]/20">
              ✦ DEMO SUBMISSIONS OPEN FOR BANSILALPET STEPWELL VOL. 04
            </div>

          </div>
        ) : (
          /* LOGGED IN STATE: COMPLETE ARTIST DASHBOARD */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* DASHBOARD SIDEBAR NAVIGATION (COL-3) */}
            <div className="lg:col-span-3 bg-[#191410] border-2 border-[#d1a437] p-4 shadow-[6px_6px_0px_#191410] flex flex-col gap-2 text-left">
              <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase tracking-widest px-2 mb-1">DASHBOARD NAVIGATION</span>
              
              {[
                { id: 'profile', label: '👤 PROFILE & BIO' },
                { id: 'portfolio', label: '🎵 AUDIO & MEDIA' },
                { id: 'invites', label: '✉️ SESSION INVITES' },
                { id: 'notifications', label: '🔔 NOTIFICATIONS (2)' },
                { id: 'settings', label: '⚙️ SETTINGS' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => { playSFX('ticketClick'); setDashTab(item.id); }}
                  className={`p-3 font-mono text-xs font-bold text-left transition-all ${dashTab === item.id ? 'bg-[#d1a437] text-[#191410] border border-[#191410]' : 'text-[#ecdcaf] hover:bg-[#8a2320]'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* DASHBOARD MAIN CONTENT (COL-9) */}
            <div className="lg:col-span-9 bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 shadow-[10px_10px_0px_#8a2320] text-left flex flex-col gap-6">
              
              {savedSuccess && (
                <div className="p-3 bg-emerald-800 text-emerald-100 font-mono text-xs font-bold border border-[#191410]">
                  ✓ ARTIST PROFILE UPDATED SUCCESSFULLY
                </div>
              )}

              {/* TAB 1: EDIT PROFILE */}
              {dashTab === 'profile' && (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b-2 border-[#191410] pb-3">
                    <h3 className="font-poster text-2xl text-[#191410]">EDIT ARTIST PROFILE</h3>
                    <span className="font-mono text-[9px] font-bold text-[#c2272a]">ID: TS-ART-901</span>
                  </div>

                  {/* COVER & AVATAR UPLOAD STUBS */}
                  <div className="relative w-full h-36 bg-[#191410] border-2 border-[#191410] overflow-hidden flex items-center justify-center">
                    <img src="/media/gallery/tangy3.jpg" alt="Cover" className="w-full h-full object-cover opacity-60" />
                    <button type="button" className="absolute bottom-2 right-2 px-3 py-1 bg-[#ecdcaf] text-[#191410] font-mono text-[9px] font-bold border border-[#191410]">
                      📷 CHANGE COVER
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="font-mono text-xs font-bold text-[#191410]">BIOGRAPHY</label>
                    <textarea 
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-xs font-bold text-[#191410] block mb-1">LOCATION</label>
                      <input 
                        type="text" 
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full p-2.5 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-xs font-bold text-[#191410] block mb-1">PRIMARY INSTRUMENTS</label>
                      <input 
                        type="text" 
                        value={instruments}
                        onChange={(e) => setInstruments(e.target.value)}
                        className="w-full p-2.5 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-xs font-bold text-[#191410] block mb-1">INSTAGRAM</label>
                      <input 
                        type="text" 
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        className="w-full p-2.5 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-xs font-bold text-[#191410] block mb-1">SPOTIFY URL</label>
                      <input 
                        type="text" 
                        value={spotify}
                        onChange={(e) => setSpotify(e.target.value)}
                        className="w-full p-2.5 bg-[#ecdcaf] border border-[#191410] font-mono text-xs text-[#191410] outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full py-3 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all mt-2"
                  >
                    SAVE PROFILE CHANGES →
                  </button>
                </form>
              )}

              {/* TAB 2: PORTFOLIO & MEDIA */}
              {dashTab === 'portfolio' && (
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between items-center border-b-2 border-[#191410] pb-3">
                    <h3 className="font-poster text-2xl text-[#191410]">DEMOS & MEDIA UPLOADS</h3>
                    <button 
                      onClick={handleAddTrack}
                      className="px-3 py-1 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold border border-[#191410] shadow-sm active:scale-95"
                    >
                      + UPLOAD NEW DEMO
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {audioTracks.map((track) => (
                      <div key={track.id} className="p-3 bg-[#ecdcaf] border border-[#191410] flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-base font-bold">🎵</span>
                          <div>
                            <h4 className="font-poster text-base text-[#191410]">{track.title}</h4>
                            <span className="font-mono text-[9px] text-[#241a12]/70">{track.duration}</span>
                          </div>
                        </div>
                        <span className={`font-mono text-[9px] font-bold px-2 py-0.5 border ${track.status === 'APPROVED' ? 'bg-emerald-900 text-emerald-200 border-emerald-700' : 'bg-yellow-900 text-yellow-200 border-yellow-700'}`}>
                          {track.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: INVITES */}
              {dashTab === 'invites' && (
                <div className="flex flex-col gap-4">
                  <h3 className="font-poster text-2xl text-[#191410] border-b-2 border-[#191410] pb-2">SESSION INVITATIONS</h3>
                  
                  <div className="p-4 bg-[#191410] text-[#ecdcaf] border-2 border-[#191410] flex flex-col gap-2">
                    <span className="font-mono text-[9px] font-bold text-[#d1a437] uppercase">INVITATION #TS-INV-402</span>
                    <h4 className="font-poster text-xl text-[#ecdcaf]">BANSILALPET STEPWELL MONSOON SESSION</h4>
                    <p className="font-mono text-xs text-[#ecdcaf]/80">Date: August 15, 2026 · Stage: Main Stepwell Sanctuary</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => playSFX('ticketClick')} className="px-4 py-1.5 bg-[#d1a437] text-[#191410] font-mono text-xs font-bold">ACCEPT INVITATION</button>
                      <button onClick={() => playSFX('ticketClick')} className="px-4 py-1.5 bg-transparent border border-[#ecdcaf] text-[#ecdcaf] font-mono text-xs font-bold">DECLINE</button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: NOTIFICATIONS */}
              {dashTab === 'notifications' && (
                <div className="flex flex-col gap-3">
                  <h3 className="font-poster text-2xl text-[#191410] border-b-2 border-[#191410] pb-2">NOTIFICATIONS CENTER</h3>
                  <div className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs">
                    🔔 Your demo track "Stepwell Echoes" was approved by Curator Arjuna.
                  </div>
                  <div className="p-3 bg-[#ecdcaf] border border-[#191410] font-mono text-xs">
                    🔔 Soundcheck scheduled for 05:00 PM at Bansilalpet Stepwell.
                  </div>
                </div>
              )}

              {/* TAB 5: SETTINGS */}
              {dashTab === 'settings' && (
                <div className="flex flex-col gap-4 font-mono text-xs">
                  <h3 className="font-poster text-2xl text-[#191410] border-b-2 border-[#191410] pb-2">PORTAL PREFERENCES</h3>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Receive email dispatch notifications for new sessions
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked /> Allow private session booking inquiries
                  </label>
                </div>
              )}

            </div>

          </div>
        )}

      </main>

      <Footer />
    </motion.div>
  );
};
