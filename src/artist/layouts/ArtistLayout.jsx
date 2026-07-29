import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ArtistNavbar } from '../components/ArtistNavbar';

export const ArtistLayout = () => {
  return (
    <AuthProvider>
      <div className="w-full min-h-[100dvh] bg-[#191410] text-[#ecdcaf] font-sans antialiased selection:bg-[#c2272a] selection:text-[#ecdcaf] pt-16">
        {/* Grain overlay */}
        <div className="fixed inset-0 pointer-events-none z-[90] opacity-[0.04] bg-[url('/noise.png')] bg-repeat" />
        
        {/* Dedicated Artist Top Navbar */}
        <ArtistNavbar />

        {/* Outlet for Artist Routes */}
        <main className="w-full">
          <Outlet />
        </main>
      </div>
    </AuthProvider>
  );
};
