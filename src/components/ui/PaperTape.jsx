export const PaperTape = ({ rotation = "-2deg", width = "w-20", className = "" }) => {
  return (
    <div 
      style={{ transform: `rotate(${rotation})` }}
      className={`h-5 bg-[rgba(231,213,164,0.85)] border border-black/25 shadow-xs pointer-events-none select-none z-30 ${width} ${className}`}
    />
  );
};
