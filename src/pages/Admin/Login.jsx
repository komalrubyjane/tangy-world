import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/admin/dashboard');
  };

  return (
    <div className="w-full min-h-screen bg-[#191410] text-[#ecdcaf] flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-md bg-[#0d0a07] border-4 border-[#d1a437] p-6 shadow-[12px_12px_0px_#4c1210] flex flex-col gap-4 text-left">
        <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">RESTRICTED ACCESS</span>
        <h1 className="font-poster text-3xl text-[#ecdcaf]">ADMIN LOGIN</h1>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs">EMAIL</label>
          <input 
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@tangysessions.com"
            className="p-2.5 bg-[#191410] border border-[#ecdcaf]/30 font-mono text-xs text-[#ecdcaf] outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-mono text-xs">PASSWORD</label>
          <input 
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="p-2.5 bg-[#191410] border border-[#ecdcaf]/30 font-mono text-xs text-[#ecdcaf] outline-none"
          />
        </div>

        <button 
          type="submit"
          className="w-full py-3 bg-[#c2272a] text-[#ecdcaf] font-mono text-xs font-bold uppercase border border-[#ecdcaf] hover:bg-[#d1a437] hover:text-[#191410] transition-all mt-2"
        >
          AUTHENTICATE & ENTER →
        </button>
      </form>
    </div>
  );
}
