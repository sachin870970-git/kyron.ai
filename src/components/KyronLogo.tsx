import React from 'react';

interface KyronLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  animated?: boolean;
  withText?: boolean;
  textClassName?: string;
  variant?: 'full' | 'glyph' | 'symbol';
}

/**
 * KYRON AI — The Definitive Celestial Intelligence Emblem
 * 
 * Anatomy:
 * 1. The Celestial Orbital Ring: An elliptical comet trajectory circling the core with glowing particle nodes.
 * 2. The Photonic Monogram 'K':
 *    - Left: Vertical cyber-crystal pillar with gradient light refraction.
 *    - Top-Right: Sweeping comet plasma arc with a blazing celestial nucleus.
 *    - Bottom-Right: Quantum laser chevron with geometric acute angles.
 * 3. The Hyper-Core: Glowing fusion star at the intersection point.
 */
export const KyronLogo: React.FC<KyronLogoProps> = ({
  size = 'md',
  className = '',
  animated = true,
  withText = false,
  textClassName = '',
  variant = 'full',
}) => {
  // Resolve pixel size
  let pxSize = 36;
  if (typeof size === 'number') {
    pxSize = size;
  } else {
    switch (size) {
      case 'xs':
        pxSize = 20;
        break;
      case 'sm':
        pxSize = 28;
        break;
      case 'md':
        pxSize = 38;
        break;
      case 'lg':
        pxSize = 56;
        break;
      case 'xl':
        pxSize = 84;
        break;
    }
  }

  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Kyron Celestial Emblem SVG */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{ width: pxSize, height: pxSize }}
      >
        {/* Soft Ambient Radial Aura */}
        <div
          className={`absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/30 via-indigo-500/20 to-fuchsia-500/30 blur-md pointer-events-none ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ transform: 'scale(1.2)' }}
        />

        <svg
          viewBox="0 0 100 100"
          width={pxSize}
          height={pxSize}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`relative z-10 filter drop-shadow-[0_0_12px_rgba(6,182,212,0.5)] ${
            animated ? 'transition-transform duration-300 hover:scale-105' : ''
          }`}
        >
          <defs>
            {/* Primary Kyron Electric Cyan-to-Cobalt Gradient */}
            <linearGradient id={`kyronPrimary-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22D3EE" /> {/* Bright Cyan */}
              <stop offset="50%" stopColor="#38BDF8" /> {/* Sky Blue */}
              <stop offset="100%" stopColor="#6366F1" /> {/* Indigo */}
            </linearGradient>

            {/* Comet Blazing Tail Gradient */}
            <linearGradient id={`cometTail-${uniqueId}`} x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" /> {/* Purple */}
              <stop offset="40%" stopColor="#EC4899" /> {/* Hot Pink */}
              <stop offset="80%" stopColor="#38BDF8" /> {/* Cyan */}
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.2" />
            </linearGradient>

            {/* Laser Arm Gradient */}
            <linearGradient id={`kyronLaser-${uniqueId}`} x1="0%" y1="50%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="70%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" /> {/* Emerald tip */}
            </linearGradient>

            {/* Orbital Ring Gradient */}
            <linearGradient id={`kyronOrbit-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#818CF8" stopOpacity="0.3" />
              <stop offset="70%" stopColor="#C084FC" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
            </linearGradient>

            {/* Glowing Core Filter */}
            <filter id={`kyronGlow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. Celestial Outer Orbital Ring (The Comet Orbit) */}
          <ellipse
            cx="50"
            cy="50"
            rx="43"
            ry="24"
            transform="rotate(-28 50 50)"
            stroke={`url(#kyronOrbit-${uniqueId})`}
            strokeWidth="2.5"
            strokeDasharray="90 20 40 15"
            strokeLinecap="round"
            className={animated ? 'animate-[spin_16s_linear_infinite]' : ''}
            style={{ transformOrigin: '50px 50px' }}
          />

          {/* 2. Orbiting Comet Dust Particles */}
          <circle cx="84" cy="34" r="2" fill="#22D3EE" filter={`url(#kyronGlow-${uniqueId})`} />
          <circle cx="16" cy="66" r="1.5" fill="#E879F9" />
          <circle cx="50" cy="18" r="1.2" fill="#38BDF8" />

          {/* 3. Central Kyron Shield / Backdrop Base */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="#030712"
            fillOpacity="0.85"
            stroke="#1E293B"
            strokeWidth="1.2"
          />

          {/* 4. The Monogram 'K' - Vertical Photonic Pillar */}
          <path
            d="M28 22 C28 20.34 29.34 19 31 19 L36 19 C37.66 19 39 20.34 39 22 L39 78 C39 79.66 37.66 81 36 81 L31 81 C29.34 81 28 79.66 28 78 Z"
            fill={`url(#kyronPrimary-${uniqueId})`}
          />
          {/* Inner Light Core of the Pillar */}
          <path
            d="M32 24 L35 24 L35 76 L32 76 Z"
            fill="#FFFFFF"
            fillOpacity="0.65"
          />

          {/* 5. The Upper Diagonal - Sweeping Comet Plasma Arc (Head of 'K') */}
          <path
            d="M37 52 L62 24 C63.5 22.3 66.2 22.8 67.2 24.8 L69.5 29.5 C70.2 30.8 69.8 32.4 68.6 33.5 L48 53 Z"
            fill={`url(#cometTail-${uniqueId})`}
            filter={`url(#kyronGlow-${uniqueId})`}
          />

          {/* Blazing Comet Head Nucleus at Top-Right of K */}
          <circle
            cx="66"
            cy="27"
            r="4.5"
            fill="#FFFFFF"
            filter={`url(#kyronGlow-${uniqueId})`}
          />
          <circle cx="66" cy="27" r="2.2" fill="#38BDF8" />

          {/* 6. The Lower Diagonal - High-Velocity Laser Chevron (Leg of 'K') */}
          <path
            d="M44 49 L69 75 C70.3 76.3 72.5 76.1 73.5 74.5 L75.8 70.8 C76.5 69.6 76.1 68.1 75 67.1 L54 46 Z"
            fill={`url(#kyronLaser-${uniqueId})`}
          />
          {/* Laser Highlight */}
          <path
            d="M56 57 L72 73"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />

          {/* 7. Central Quantum Nexus Spark (Intersection of K) */}
          <g transform="translate(42, 50)">
            <circle cx="0" cy="0" r="4.2" fill="#FFFFFF" filter={`url(#kyronGlow-${uniqueId})`} />
            <polygon
              points="0,-6 1.8,-1.8 6,0 1.8,1.8 0,6 -1.8,1.8 -6,0 -1.8,-1.8"
              fill="#22D3EE"
            />
          </g>
        </svg>
      </div>

      {/* Optional Wordmark */}
      {withText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-black tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent font-sans ${
                textClassName || 'text-base sm:text-lg'
              }`}
            >
              KYRON AI
            </span>
            <span className="text-[9px] font-mono font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              CORE
            </span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono tracking-wider -mt-0.5">
            Celestial Autonomous Intelligence
          </span>
        </div>
      )}
    </div>
  );
};
