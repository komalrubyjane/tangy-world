export const MusicalArtifact = ({ type = "vinyl", className = "" }) => {
  const artifactMap = {
    vinyl: "/media/vinyl.png",
    gramophone: "/media/gramophone.png",
    radio: "/media/radio.png",
    violin: "/media/violin.png",
    mic: "/media/microphone.png",
    vintageMic: "/media/vintage-mic2.png"
  };

  const src = artifactMap[type] || artifactMap.vinyl;

  return (
    <div className={`pointer-events-none select-none ${className}`}>
      <img src={src} alt={type} className="w-full h-full object-contain filter drop-shadow-2xl" />
    </div>
  );
};
