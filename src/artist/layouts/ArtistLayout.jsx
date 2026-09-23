import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ArtistNavbar } from '../components/ArtistNavbar';

export const ArtistLayout = () => {
  return (
    <AuthProvider>
      <div className="w-full min-h-[100dvh] bg-[#181614] printNoise text-[#ecdcaf] font-sans antialiased selection:bg-[#B5532A] selection:text-[#ecdcaf] pt-16">
        {/* Grain overlay */}
        
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
