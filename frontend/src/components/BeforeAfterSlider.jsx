import { useState } from 'react';

export default function BeforeAfterSlider({ beforeImage, afterImage }) {
  const [sliderPosition, setSliderPosition] = useState(50);

  // Fallback to placeholder if any image is missing
  const before = beforeImage || '/placeholder.jpg';
  const after = afterImage || '/placeholder.jpg';

  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] rounded-3xl overflow-hidden border border-white/10 shadow-2xl select-none group">
      
      {/* "Before" Image - Base layer */}
      <img
        src={before}
        alt="Before Repair"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      {/* Before Badge */}
      <span className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border border-white/10 z-20">
        Before (Citizen)
      </span>

      {/* "After" Image - Clipped layer */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        style={{
          clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
        }}
      >
        <img
          src={after}
          alt="After Repair"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />
        {/* After Badge */}
        <span className="absolute bottom-4 right-4 bg-primary-500/80 backdrop-blur-md text-white text-[10px] font-black tracking-widest uppercase px-3 py-1.5 rounded-lg border border-primary-500/20 z-20">
          After (Resolved ✅)
        </span>
      </div>

      {/* Glow vertical divider line */}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary-400 via-white to-primary-400 pointer-events-none z-20 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Glowing Center Handle Knob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 border-2 border-primary-400 flex items-center justify-center text-xs font-black shadow-[0_0_15px_rgba(99,102,241,0.5)] z-20 group-hover:scale-110 transition-transform">
          <span className="text-white select-none animate-pulse">↔</span>
        </div>
      </div>

      {/* Invisible range controller layer */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPosition}
        onChange={(e) => setSliderPosition(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
      />
    </div>
  );
}
