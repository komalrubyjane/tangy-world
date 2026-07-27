export const audioManifest = {
  ambience: {
    hero: { freq: 55, subFreq: 110, filter: 1200, label: "Room Tone & Vinyl" },
    manifesto: { freq: 48, subFreq: 96, filter: 800, label: "Analogue Noise" },
    history: { freq: 60, subFreq: 120, filter: 1000, label: "Tape Hiss & Mechanical" },
    archive: { freq: 50, subFreq: 100, filter: 1500, label: "Projector Hum" },
    spaces: { freq: 44, subFreq: 88, filter: 600, label: "Stone Reverb Ambience" },
    diary: { freq: 52, subFreq: 104, filter: 900, label: "Intimate Journal Space" },
    artists: { freq: 65, subFreq: 130, filter: 2000, label: "Warm Music Atmosphere" },
  },
  sfx: {
    curtainOpen: "curtainOpen",
    micDrop: "micDrop",
    pageTurn: "pageTurn",
    ticketClick: "ticketClick",
    metalClick: "metalClick"
  }
};
