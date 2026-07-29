import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAudio } from '../../audio/AudioContext';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playSFX } = useAudio();

  const upcomingShows = [
    { event: 'Stepwell Sessions Vol. 12', date: 'Jun 14', status: 'confirmed', venue: 'Bansilal Stepwell', time: '11 PM' },
    { event: 'Underground Vol. 4', date: 'Jul 2', status: 'pending', venue: 'TBA', time: '10:30 PM' },
  ];

  const invites = [
    { event: 'Monsoon Rave', date: 'Aug 10', deadline: '3 days left', organizer: 'Tangy Sessions' },
  ];

  const quickActions = [
    { label: 'UPDATE BIO', icon: '✍', path: '/artist/profile' },
    { label: 'AVAILABILITY', icon: '📅', path: '/artist/calendar' },
    { label: 'UPLOAD MEDIA', icon: '🎵', path: '/artist/media' },
    { label: 'SETTINGS', icon: '⚙️', path: '/artist/settings' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-50px)] p-3 sm:p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-4 sm:gap-8 text-left overflow-x-hidden">
      
      {/* HEADER BANNER */}
      <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-8 shadow-[6px_6px_0px_#4c1210] sm:shadow-[10px_10px_0px_#4c1210] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 max-w-full">
        <div>
          <span className="font-mono text-[8.5px] sm:text-[9px] font-bold text-[#c2272a] tracking-[0.25em] sm:tracking-[0.3em] uppercase">
            ARTIST WORKSPACE // CONTROL CENTER
          </span>
          <h1 className="font-poster text-3xl sm:text-5xl text-[#191410] leading-none mt-1">
            WELCOME BACK, <span className="text-[#c2272a]">{user?.name || 'ARTIST'}</span>
          </h1>
          <p className="font-mono text-[10.5px] sm:text-xs text-[#241a12]/80 mt-1 uppercase">
            {user?.genre || 'Techno / Deep House'} · {user?.city || 'Hyderabad'}
          </p>
        </div>

        <button
          onClick={() => { playSFX('ticketClick'); navigate('/artist/profile'); }}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#191410] text-[#ecdcaf] font-mono text-xs font-bold uppercase border-2 border-[#191410] shadow-[3px_3px_0px_#c2272a] hover:bg-[#c2272a] transition-all min-h-[44px] text-center"
        >
          EDIT PROFILE →
        </button>
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">UPCOMING SHOWS</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#c2272a] leading-none my-0.5 sm:my-1">2</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">NEXT: JUN 14</span>
        </div>

        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">PROFILE COMPLETE</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#2e6834] leading-none my-0.5 sm:my-1">{user?.profileComplete || 85}%</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">HIGH QUALITY PROFILE</span>
        </div>

        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">PENDING INVITES</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#c2272a] leading-none my-0.5 sm:my-1">1</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">ACTION REQUIRED</span>
        </div>

        <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-3 border-[#191410] p-3 sm:p-4 shadow-[4px_4px_0px_#191410]">
          <span className="font-mono text-[8px] sm:text-[9px] font-bold text-[#241a12]/70 uppercase">TOTAL SHOWS</span>
          <p className="font-poster text-3xl sm:text-4xl text-[#191410] leading-none my-0.5 sm:my-1">47</p>
          <span className="font-mono text-[8px] sm:text-[9px] text-[#241a12]/60 uppercase">SINCE 2019</span>
        </div>
      </div>

      {/* MAIN TWO COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-8">
        
        {/* LEFT TWO COLUMNS: SHOWS & INVITATIONS */}
        <div className="lg:col-span-2 flex flex-col gap-4 sm:gap-6">
          
          {/* UPCOMING PERFORMANCES */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <div className="flex justify-between items-center border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              <span className="font-mono text-xs font-bold text-[#c2272a] uppercase">UPCOMING PERFORMANCES</span>
              <button 
                onClick={() => navigate('/artist/calendar')} 
                className="font-mono text-[9.5px] sm:text-[10px] font-bold text-[#191410] underline uppercase"
              >
                VIEW CALENDAR →
              </button>
            </div>

            <div className="flex flex-col gap-2.5 sm:gap-3">
              {upcomingShows.map((s, idx) => (
                <div key={idx} className="p-3 sm:p-4 bg-[#ecdcaf] border-2 border-[#191410] flex justify-between items-center gap-3">
                  <div>
                    <h3 className="font-poster text-lg sm:text-xl text-[#191410] leading-tight">{s.event}</h3>
                    <p className="font-mono text-[9.5px] sm:text-[10px] text-[#241a12]/80 uppercase">{s.venue} · {s.time}</p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="font-mono text-xs font-bold text-[#c2272a]">{s.date}</span>
                    <span className={`px-2 py-0.5 font-mono text-[8.5px] sm:text-[9px] font-bold uppercase border border-[#191410] ${s.status === 'confirmed' ? 'bg-[#2e6834] text-[#ecdcaf]' : 'bg-[#d1a437] text-[#191410]'}`}>
                      {s.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* EVENT INVITATIONS */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              EVENT INVITATIONS
            </span>

            <div className="flex flex-col gap-3">
              {invites.map((inv, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 bg-[#191410] text-[#ecdcaf] border-2 border-[#191410] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="font-poster text-xl sm:text-2xl text-[#ecdcaf]">{inv.event}</h3>
                    <p className="font-mono text-[9.5px] sm:text-[10px] text-[#ecdcaf]/80 uppercase">{inv.organizer} · {inv.date}</p>
                    <span className="font-mono text-[8.5px] sm:text-[9px] text-[#d1a437] uppercase block mt-0.5 sm:mt-1">⏱ DEADLINE: {inv.deadline}</span>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                      onClick={() => alert('Invitation Accepted!')} 
                      className="flex-1 sm:flex-initial px-3 py-2 bg-[#2e6834] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410] uppercase text-center min-h-[38px]"
                    >
                      ACCEPT
                    </button>
                    <button 
                      onClick={() => alert('Invitation Declined')} 
                      className="flex-1 sm:flex-initial px-3 py-2 bg-[#c2272a] text-[#ecdcaf] font-mono text-[10px] font-bold border border-[#191410] uppercase text-center min-h-[38px]"
                    >
                      DECLINE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: QUICK ACTIONS & RECENT ACTIVITY */}
        <div className="flex flex-col gap-4 sm:gap-6">
          
          {/* QUICK ACTIONS GRID */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              QUICK ACTIONS
            </span>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {quickActions.map((qa, idx) => (
                <button
                  key={idx}
                  onClick={() => { playSFX('ticketClick'); navigate(qa.path); }}
                  className="p-3 sm:p-4 bg-[#ecdcaf] border-2 border-[#191410] flex flex-col items-center gap-1 font-mono text-[9.5px] sm:text-[10px] font-bold text-[#191410] hover:bg-[#c2272a] hover:text-[#ecdcaf] transition-all shadow-[2px_2px_0px_#191410] sm:shadow-[3px_3px_0px_#191410] active:scale-95 min-h-[64px] justify-center"
                >
                  <span className="text-lg sm:text-xl">{qa.icon}</span>
                  <span>{qa.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY STREAM */}
          <div className="bg-[#e9decb] text-[#241a12] border-2 sm:border-4 border-[#191410] p-4 sm:p-6 shadow-[6px_6px_0px_#191410]">
            <span className="font-mono text-xs font-bold text-[#c2272a] uppercase block border-b-2 border-[#191410] pb-2 sm:pb-3 mb-3 sm:mb-4">
              RECENT ACTIVITY
            </span>

            <div className="flex flex-col gap-2 font-mono text-[9.5px] sm:text-[10px]">
              {[
                { msg: 'Booking confirmed for Stepwell Vol. 12', time: '2h ago' },
                { msg: 'New invitation received from Tangy Sessions', time: '1d ago' },
                { msg: 'Profile viewed 23 times this week', time: '3d ago' },
              ].map((act, idx) => (
                <div key={idx} className="border-b border-[#191410]/20 pb-2">
                  <p className="text-[#241a12] font-bold">{act.msg}</p>
                  <span className="text-[#c2272a] text-[8px] sm:text-[8.5px]">{act.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
