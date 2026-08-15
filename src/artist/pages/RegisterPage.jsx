import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAudio } from '../../audio/AudioContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { playSFX } = useAudio();

  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    genre: [],
    city: '',
    bio: '',
    instagram: '',
    soundcloud: '',
    experience: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const genresList = [
    'Techno', 'Deep House', 'Ambient', 'Afrobeat', 'Jazz Fusion', 
    'Psytrance', 'Drum & Bass', 'Experimental', 'World Music', 'Electronic'
  ];

  const toggleGenre = (g) => {
    playSFX('ticketClick');
    setForm(f => ({
      ...f,
      genre: f.genre.includes(g) ? f.genre.filter(x => x !== g) : [...f.genre, g]
    }));
  };

  const handleNext = async () => {
    playSFX('ticketClick');
    if (step < totalSteps) {
      setStep(s => s + 1);
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    const res = await authService.applyAsArtist({
      email: form.email,
      password: form.password,
      name: form.name || 'New Artist',
      genre: form.genre.join(', ') || 'Electronic',
      city: form.city || 'Hyderabad',
      bio: form.bio || 'Pending review by curation team...',
      instagram: form.instagram,
      soundcloud: form.soundcloud,
      experienceLevel: form.experience,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
    } else {
      setSubmitError(res.error || 'Something went wrong submitting your application.');
    }
  };

  const handleBack = () => {
    playSFX('ticketClick');
    setStep(s => s - 1);
  };

  if (submitted) {
    return (
      <div className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-8 shadow-[14px_14px_0px_#4c1210] text-center flex flex-col items-center gap-4 animate-bounce">
          <div className="w-16 h-16 rounded-full bg-[#c2272a] text-[#ecdcaf] font-poster text-3xl flex items-center justify-center border-2 border-[#191410]">
            ✦
          </div>
          <h2 className="font-poster text-3xl text-[#191410]">APPLICATION SUBMITTED!</h2>
          <p className="font-mono text-xs text-[#241a12]/80 leading-relaxed">
            Your audition profile has been submitted. The Tangy Sessions curation team will review your tracks and reach out within 3–5 days.
          </p>
          <button
            onClick={() => { playSFX('ticketClick'); navigate('/artist/login'); }}
            className="w-full py-3 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold tracking-[0.2em] uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all mt-2"
          >
            PROCEED TO LOGIN →
          </button>
        </div>
      </div>
    );
  }

  const stepTitles = ['Identity', 'Sound', 'Story', 'Links'];

  return (
    <div className="w-full min-h-[calc(100vh-64px)] flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-2xl bg-[#e9decb] text-[#241a12] border-4 border-[#191410] p-6 sm:p-10 shadow-[14px_14px_0px_#4c1210] text-left flex flex-col gap-6">
        
        {/* STEP PROGRESS BAR */}
        <div className="flex flex-col gap-2 border-b-2 border-[#191410] pb-4">
          <div className="flex justify-between items-center font-mono text-[9px] font-bold text-[#c2272a] uppercase tracking-widest">
            <span>AUDITION APPLICATION WIZARD</span>
            <span>STEP {step} OF {totalSteps}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 my-1">
            {stepTitles.map((t, idx) => (
              <div 
                key={t}
                className={`h-2 border border-[#191410] transition-all ${idx + 1 <= step ? 'bg-[#c2272a]' : 'bg-[#ecdcaf]'}`}
              />
            ))}
          </div>

          <div className="flex justify-between font-mono text-[8.5px] text-[#241a12]/70 uppercase">
            {stepTitles.map((t, idx) => (
              <span key={t} className={idx + 1 === step ? 'font-bold text-[#c2272a]' : ''}>
                {idx + 1}. {t}
              </span>
            ))}
          </div>
        </div>

        {/* STEP 1: IDENTITY */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-poster text-3xl text-[#191410]">WHO ARE YOU?</h2>
            <p className="font-mono text-xs text-[#241a12]/70">Start with the basics — your artist identity and contact credentials.</p>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">ARTIST / BAND NAME *</label>
              <input 
                type="text" 
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="STAGE NAME"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">EMAIL ADDRESS *</label>
              <input 
                type="email" 
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="artist@example.com"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">CREATE PASSWORD *</label>
              <input 
                type="password" 
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: SOUND */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-poster text-3xl text-[#191410]">WHAT'S YOUR SOUND?</h2>
            <p className="font-mono text-xs text-[#241a12]/70">Select your primary genres and performance experience level.</p>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-2 uppercase">SELECT GENRES (MULTI-SELECT)</label>
              <div className="flex flex-wrap gap-2">
                {genresList.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 font-mono text-[10px] font-bold uppercase border-2 transition-all ${form.genre.includes(g) ? 'bg-[#c2272a] text-[#ecdcaf] border-[#191410]' : 'bg-[#ecdcaf] text-[#191410] border-[#191410]/40 hover:border-[#191410]'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">EXPERIENCE LEVEL</label>
              <select
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: e.target.value })}
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              >
                <option value="">SELECT LEVEL</option>
                <option value="Emerging (1–2 years)">Emerging (1–2 years)</option>
                <option value="Mid-level (3–5 years)">Mid-level (3–5 years)</option>
                <option value="Established (5+ years)">Established (5+ years)</option>
                <option value="Veteran (10+ years)">Veteran (10+ years)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 3: STORY */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-poster text-3xl text-[#191410]">TELL YOUR STORY</h2>
            <p className="font-mono text-xs text-[#241a12]/70">Write an artist bio and tell us where your sonic roots are based.</p>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">CITY / LOCATION *</label>
              <input 
                type="text" 
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Hyderabad, India"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">ARTIST BIOGRAPHY *</label>
              <textarea 
                rows={5}
                required
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell us who you are, what instruments you play, and what makes your live acoustic/electronic sets unique..."
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: LINKS */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h2 className="font-poster text-3xl text-[#191410]">CONNECT THE DOTS</h2>
            <p className="font-mono text-xs text-[#241a12]/70">Add your social handles so curators can sample your recordings.</p>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">INSTAGRAM HANDLE</label>
              <input 
                type="text" 
                value={form.instagram}
                onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                placeholder="@yourhandle"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>

            <div>
              <label className="font-mono text-[9.5px] font-bold text-[#241a12] block mb-1 uppercase">SOUNDCLOUD / SPOTIFY URL</label>
              <input 
                type="text" 
                value={form.soundcloud}
                onChange={(e) => setForm({ ...form, soundcloud: e.target.value })}
                placeholder="soundcloud.com/yourname"
                className="w-full p-3 bg-[#ecdcaf] border-2 border-[#191410] font-mono text-xs text-[#191410] outline-none"
              />
            </div>
          </div>
        )}

        {submitError && (
          <div className="p-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410]">
            ✕ {submitError}
          </div>
        )}

        {/* CONTROLS */}
        <div className="flex justify-between items-center border-t-2 border-[#191410]/20 pt-4 mt-2">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 bg-[#ecdcaf] text-[#191410] border-2 border-[#191410] font-mono text-xs font-bold active:scale-95"
            >
              ← BACK
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { playSFX('ticketClick'); navigate('/artist/login'); }}
              className="font-mono text-xs text-[#c2272a] font-bold underline uppercase"
            >
              HAVE AN ACCOUNT?
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting}
            className="px-6 py-3 bg-[#191410] text-[#ecdcaf] hover:bg-[#c2272a] font-mono text-xs font-bold tracking-widest uppercase border-2 border-[#191410] shadow-[4px_4px_0px_#c2272a] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'SUBMITTING...' : step === totalSteps ? 'SUBMIT AUDITION →' : 'CONTINUE →'}
          </button>
        </div>

      </div>
    </div>
  );
};
