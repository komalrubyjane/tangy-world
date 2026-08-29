// MOCK data for the admin-managed Tangy TV channel list. Seeded from the
// video files already bundled in public/media/background-video/ — the same
// files the player's default playlist (src/components/tv/playlist.js)
// discovers via import.meta.glob. Admin edits here are what the player
// actually plays from (see tvChannelService.getPlaylist()), so add/edit/
// delete here has a real, visible effect on the live TV.
import { loadOrSeed, persist } from './store';

const SEED = [
  { id: 'tv-001', title: 'Damini Bhatlacharya — Live Session', url: '/media/background-video/Fresh from the archives, when @daminibhatlach performed for us, the space softened around her, w.mp4', status: 'active' },
  { id: 'tv-002', title: 'Field Recording — Vol. 22402', url: '/media/background-video/Video-22402.mp4', status: 'active' },
  { id: 'tv-003', title: 'Field Recording — Vol. 22653', url: '/media/background-video/Video-22653.mp4', status: 'active' },
  { id: 'tv-004', title: 'Field Recording — Vol. 37256', url: '/media/background-video/Video-37256.mp4', status: 'active' },
  { id: 'tv-005', title: 'Field Recording — Vol. 46723', url: '/media/background-video/Video-46723.mp4', status: 'active' },
  { id: 'tv-006', title: 'Field Recording — Vol. 63639', url: '/media/background-video/Video-63639.mp4', status: 'active' },
  { id: 'tv-007', title: 'Field Recording — Vol. 66802', url: '/media/background-video/Video-66802.mp4', status: 'active' },
  { id: 'tv-008', title: 'Field Recording — Vol. 76353', url: '/media/background-video/Video-76353.mp4', status: 'active' },
];

export const mockTVChannels = loadOrSeed('tv_channels', () => SEED);
export const saveTVChannels = () => persist('tv_channels', mockTVChannels);
