export const ArchiveStamp = ({ text = "ARCHIVE", rotation = "-6deg", color = "red", className = "" }) => {
  const colorMap = {
    red: "bg-[#5A120D] text-[#E7D5A4] border-[#15120D]",
    gold: "bg-[#D19A24] text-[#15120D] border-[#15120D]",
    blue: "bg-[#315D73] text-[#E7D5A4] border-[#15120D]",
    dark: "bg-[#15120D] text-[#E7D5A4] border-[#D19A24]",
    orange: "bg-[#B9471B] text-[#E7D5A4] border-[#15120D]"
  };

  return (
    <div 
      style={{ transform: `rotate(${rotation})` }}
      className={`inline-block font-mono text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest border-2 shadow-md pointer-events-none select-none ${colorMap[color] || colorMap.red} ${className}`}
    >
      {text} ✦
    </div>
  );
};
