import { profileService } from './profileService';

const SESSION_KEY = 'tangy_mock_session';
const OTP_MOCK = '123456';

export const authService = {
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem(SESSION_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      return null;
    }
  },

  signInWithEmail: async (email) => {
    await new Promise(r => setTimeout(r, 400));
    return { success: true, method: 'email', id: email };
  },

  signInWithPhone: async (phone) => {
    await new Promise(r => setTimeout(r, 400));
    return { success: true, method: 'phone', id: phone };
  },

  verifyOtp: async (method, id, otp) => {
    await new Promise(r => setTimeout(r, 600));
    if (otp === OTP_MOCK) {
      const userId = `mock_${id.replace(/[^a-zA-Z0-9]/g, '')}`;
      let profile = await profileService.getProfile(userId);
      
      if (!profile) {
        profile = await profileService.createProfile(userId, { [method]: id });
      }

      const user = {
        id: userId,
        [method]: id,
        name: profile.fullName || (method === 'email' ? id.split('@')[0] : 'Artist Member'),
        memberSince: new Date(profile.createdAt).getFullYear(),
        profileCompleted: profile.profileCompleted,
        role: 'artist'
      };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, error: 'Invalid OTP. Use 123456 for testing.' };
  },

  loginDirect: async (email, password) => {
    await new Promise(r => setTimeout(r, 600));
    const user = {
      id: `mock_${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email,
      name: email.split('@')[0].toUpperCase(),
      role: 'artist',
      genre: 'Techno / Deep House',
      city: 'Hyderabad',
      profileComplete: 85
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return { success: true, user };
  },

  logout: async () => {
    await new Promise(r => setTimeout(r, 300));
    localStorage.removeItem(SESSION_KEY);
    return { success: true };
  }
};
