// MOCK service — not connected to Supabase/real storage. Swap the internals
// for real calls later without changing any component that imports this
// file. There's no file-upload/backend storage in this mock environment, so
// "adding a channel" means pointing at a URL — either one of the video
// files already bundled with the site, or a link to a video hosted
// elsewhere — rather than uploading a new file from disk.
import { mockTVChannels, saveTVChannels } from '../data/mock/tvChannels';

export const tvChannelService = {
  getAll: () => mockTVChannels,

  // What the live TV player actually plays — active channels only, in list
  // order (channel numbers on the player follow this order).
  getPlaylist: () => mockTVChannels.filter((c) => c.status === 'active'),

  create(data) {
    const channel = {
      id: `tv-${Date.now()}`,
      status: 'active',
      ...data,
    };
    mockTVChannels.push(channel);
    saveTVChannels();
    return channel;
  },

  update(id, updates) {
    const c = mockTVChannels.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, updates);
    saveTVChannels();
    return c;
  },

  remove(id) {
    const idx = mockTVChannels.findIndex((x) => x.id === id);
    if (idx === -1) return false;
    mockTVChannels.splice(idx, 1);
    saveTVChannels();
    return true;
  },
};
