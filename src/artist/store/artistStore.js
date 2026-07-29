import { useState, useEffect } from 'react';

export const MOCK_INITIAL_ARTISTS = [
  {
    id: "A101",
    name: "KRYZEN",
    genre: "Deep House / Hypnotic Techno",
    city: "Mumbai",
    bio: "Architect of deep, hypnotic soundscapes. Blurring the line between time and space.",
    status: "available",
    color: "#C8FF2B",
    tags: ["Deep House", "Hypnotic Techno"],
    avatar: "/artists/artist1.jpg",
    appStatus: "approved",
    appliedAt: "2024-01-15T00:00:00.000Z"
  },
  {
    id: "A102",
    name: "Aura.wav",
    genre: "Ambient / IDM",
    city: "Bangalore",
    bio: "Crafts delicate, breathtaking sonic landscapes from field recordings and modular synths.",
    status: "available",
    color: "#06b6d4",
    tags: ["Ambient", "IDM"],
    avatar: "/artists/artist2.jpg",
    appStatus: "approved",
    appliedAt: "2024-02-10T00:00:00.000Z"
  },
  {
    id: "A103",
    name: "SONDER",
    genre: "Live Modular / Experimental",
    city: "New Delhi",
    bio: "No presets. No laptops. Pure human emotion driving electrical current through copper wire.",
    status: "tentative",
    color: "#f59e0b",
    tags: ["Live Modular", "Experimental"],
    avatar: "/artists/artist3.jpg",
    appStatus: "approved",
    appliedAt: "2024-03-01T00:00:00.000Z"
  }
];

export function useSharedStore(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = localStorage.getItem(`tangy_store_${key}`);
      return item ? JSON.parse(item) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`tangy_store_${key}`, JSON.stringify(state));
    } catch (e) {
      console.error(e);
    }
  }, [key, state]);

  return [state, setState];
}
