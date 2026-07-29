const PROFILE_STORAGE_KEY = 'tangy_mock_profiles';

export const profileService = {
  _getProfiles: () => {
    try {
      const data = localStorage.getItem(PROFILE_STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  _saveProfiles: (profiles) => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
  },

  getProfile: async (userId) => {
    await new Promise(r => setTimeout(r, 400));
    const profiles = profileService._getProfiles();
    return profiles[userId] || null;
  },

  createProfile: async (userId, initialData) => {
    await new Promise(r => setTimeout(r, 400));
    const profiles = profileService._getProfiles();
    
    if (!profiles[userId]) {
      profiles[userId] = {
        id: userId,
        fullName: "",
        username: "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        dateOfBirth: "",
        gender: "",
        avatarUrl: "",
        city: "",
        locality: "",
        state: "",
        pincode: "",
        latitude: null,
        longitude: null,
        interests: [],
        nearbyAlerts: false,
        role: "artist",
        tangyPoints: 0,
        referralCode: `TANGY-${userId.substring(userId.length - 4)}`,
        profileCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      profileService._saveProfiles(profiles);
    }
    return profiles[userId];
  },

  updateProfile: async (userId, data) => {
    await new Promise(r => setTimeout(r, 600));
    const profiles = profileService._getProfiles();
    if (profiles[userId]) {
      profiles[userId] = {
        ...profiles[userId],
        ...data,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      };
      profileService._saveProfiles(profiles);
      return profiles[userId];
    }
    throw new Error("Profile not found");
  },

  uploadAvatar: async (userId, file) => {
    await new Promise(r => setTimeout(r, 400));
    return URL.createObjectURL(file);
  }
};
