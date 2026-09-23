import { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';

const RESEND_COOLDOWN = 30;

// Supabase's own error strings for OTP failures aren't always distinct
// between "wrong code" and "expired code" (both often come back as some
// variant of "Token has expired or is invalid") — this maps as precisely as
// that allows, and never renders a raw provider message.
function friendlyOtpError(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('expired')) return 'That code has expired. Request a new one.';
  if (m.includes('invalid') || m.includes('token')) return "That code isn't correct. Please try again.";
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) return 'Too many attempts. Please wait before requesting another code.';
  return "We couldn't verify that code. Please try again.";
}

function friendlySendError(message) {
  const m = (message || '').toLowerCase();
  if (m.includes('rate limit') || m.includes('too many') || m.includes('429')) return 'Too many attempts. Please wait before requesting another code.';
  if (m.includes('valid email') || m.includes('invalid email')) return 'Please enter a valid email address.';
  return "We couldn't send the verification code. Please try again.";
}

// Real Supabase Auth email OTP — signInWithOtp() both creates the account
// (if it doesn't already exist) and sends the code; verifyOtp() confirms it
// and returns a real session. No OTP is ever generated, stored, or
// validated by Tangy's own code or database — Supabase Auth owns the whole
// lifecycle end to end. This is the ONE place that logic lives; every entry
// point that needs an authenticated Tangy account (UserLoginModal's
// Guest/User step, RequireAuthToApply for the five partner/team apply
// pages, JoinPage, JoinLoginPage, and the Artist portal's own Login/Register
// pages) renders this component rather than its own auth form.
export const EmailOtpAuth = ({ onVerified, initialEmail = '', copy = {} }) => {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requestCode = async () => {
    setError('');
    if (!isSupabaseConfigured) {
      setError('Sign-in is not available right now — please try again shortly.');
      return false;
    }
    setSending(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setSending(false);
    if (err) {
      setError(friendlySendError(err.message));
      return false;
    }
    return true;
  };

  const sendCode = async (e) => {
    e?.preventDefault();
    const ok = await requestCode();
    if (!ok) return;
    setDigits(['', '', '', '', '', '']);
    setStep('otp');
    setCooldown(RESEND_COOLDOWN);
  };

  const resend = async () => {
    if (cooldown > 0 || sending) return;
    const ok = await requestCode();
    if (!ok) return;
    setDigits(['', '', '', '', '', '']);
    setCooldown(RESEND_COOLDOWN);
  };

  const handleDigitChange = (idx, value) => {
    const v = value.replace(/[^0-9]/g, '').slice(-1);
    setDigits((d) => {
      const next = [...d];
      next[idx] = v;
      return next;
    });
    if (v && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleDigitKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split('').concat(Array(6).fill('')).slice(0, 6);
    setDigits(next);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  };

  const verify = async (e) => {
    e?.preventDefault();
    const token = digits.join('');
    if (token.length !== 6) {
      setError('Enter the full 6-digit code.');
      return;
    }
    setError('');
    setVerifying(true);
    const { data, error: err } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' });
    setVerifying(false);
    if (err) {
      setError(friendlyOtpError(err.message));
      return;
    }
    onVerified?.({ user: data.user, session: data.session, email: email.trim() });
  };

  const changeEmail = () => {
    setStep('email');
    setError('');
    setDigits(['', '', '', '', '', '']);
  };

  if (step === 'email') {
    return (
      <form onSubmit={sendCode} className="flex flex-col gap-4 font-mono text-xs">
        <p className="opacity-70 text-[11px]">
          {copy.emailIntro || "Enter your email — we'll send a one-time verification code, no password needed."}
        </p>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider mb-1">Email Address</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-3 bg-black/10 border border-current outline-none"
          />
        </div>
        {error && <div className="p-2.5 bg-[#c2272a] text-white font-bold border border-current">{error}</div>}
        <button
          type="submit"
          disabled={sending}
          className="py-3 bg-[#8B2E00] hover:bg-[#6b2400] text-[#E7D5A4] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {sending ? 'SENDING...' : 'SEND VERIFICATION CODE →'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="flex flex-col gap-4 font-mono text-xs">
      <div className="text-center">
        <h4 className="font-bold uppercase text-sm mb-1">VERIFY YOUR EMAIL</h4>
        <p className="opacity-70 text-[11px]">We've sent a verification code to</p>
        <p className="font-bold break-all">{email}</p>
      </div>

      <div className="flex justify-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={d}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleDigitKeyDown(i, e)}
            aria-label={`Digit ${i + 1} of 6`}
            className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold bg-black/10 border-2 border-current outline-none focus:bg-black/20 focus-visible:ring-2 focus-visible:ring-[#8B2E00]"
          />
        ))}
      </div>

      {error && <div className="p-2.5 bg-[#c2272a] text-white font-bold border border-current text-center">{error}</div>}

      <button
        type="submit"
        disabled={verifying}
        className="py-3 bg-[#8B2E00] hover:bg-[#6b2400] text-[#E7D5A4] font-bold uppercase tracking-widest disabled:opacity-50 transition-colors"
      >
        {verifying ? 'VERIFYING...' : 'VERIFY EMAIL →'}
      </button>

      <div className="flex justify-between items-center text-[10px] flex-wrap gap-2">
        <button type="button" onClick={changeEmail} className="underline font-bold uppercase opacity-70 hover:opacity-100">
          ← CHANGE EMAIL
        </button>
        <button
          type="button"
          onClick={resend}
          disabled={cooldown > 0 || sending}
          className="underline font-bold uppercase disabled:opacity-40 disabled:no-underline"
        >
          {cooldown > 0 ? `RESEND CODE IN ${cooldown}s` : sending ? 'SENDING...' : 'RESEND CODE'}
        </button>
      </div>
    </form>
  );
};
