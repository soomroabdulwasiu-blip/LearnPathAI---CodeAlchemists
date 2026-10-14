import React from 'react';
import { motion } from 'motion/react';

interface ProjectLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  variant?: 'full' | 'icon-only' | 'hero-vertical';
  animated?: boolean;
  className?: string;
  lightText?: boolean;
}

export const ProjectLogo: React.FC<ProjectLogoProps> = ({
  size = 'md',
  variant = 'full',
  animated = false,
  className = '',
  lightText = false,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    hero: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl',
    hero: 'text-3xl sm:text-4xl',
  };

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
    xl: 'text-xs px-3 py-1',
    hero: 'text-sm px-3.5 py-1',
  };

  const IconGraphic = (
    <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
      {(size === 'lg' || size === 'xl' || size === 'hero') && (
        <div
          className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#2D5BFF] via-[#7C3AED] to-[#06B6D4] opacity-40 blur-xl animate-pulse pointer-events-none"
          style={{ animationDuration: '4s' }}
        />
      )}
      <div className="relative w-full h-full rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-br from-[#2D5BFF] via-[#6366F1] to-[#7C3AED] shadow-lg shadow-[#2D5BFF]/30 flex items-center justify-center overflow-hidden border border-white/20">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            <linearGradient id="lp-blue-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#60A5FA" />
              <stop offset="0.5" stopColor="#3B82F6" />
              <stop offset="1" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="lp-gold-grad" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FDE047" />
              <stop offset="0.5" stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <filter id="lp-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <path
            d="M 22 75 C 22 45, 50 55, 50 30 C 50 15, 78 20, 78 40 C 78 65, 50 60, 50 82"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="3.5"
            strokeDasharray="4 4"
            strokeLinecap="round"
          />
          <path
            d="M 26 38 C 26 24, 38 18, 52 18 C 66 18, 74 25, 74 38 L 74 48 C 74 54, 69 58, 62 58 L 48 58 C 42 58, 38 62, 38 68 L 38 72"
            stroke="url(#lp-blue-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 74 62 C 74 76, 62 82, 48 82 C 34 82, 26 75, 26 62 L 26 52 C 26 46, 31 42, 38 42 L 52 42 C 58 42, 62 38, 62 32 L 62 28"
            stroke="url(#lp-gold-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="50" r="9" fill="#FFFFFF" filter="url(#lp-glow)" />
          <circle cx="50" cy="50" r="5.5" fill="#4F46E5" />
          <circle cx="36" cy="24" r="3.5" fill="#67E8F9" />
          <circle cx="64" cy="76" r="3.5" fill="#FDE047" />
          <circle cx="26" cy="55" r="3" fill="#A7F3D0" />
          <circle cx="74" cy="45" r="3" fill="#F472B6" />
          <path
            d="M 50 8 L 52 13 L 57 15 L 52 17 L 50 22 L 48 17 L 43 15 L 48 13 Z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
    </div>
  );

  const AnimatedIcon = animated ? (
    <motion.div
      animate={{
        y: [0, -6, 0],
        rotate: [0, 1, -1, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {IconGraphic}
    </motion.div>
  ) : (
    IconGraphic
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{AnimatedIcon}</div>;
  }

  if (variant === 'hero-vertical') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {AnimatedIcon}
        <div className="mt-5 sm:mt-6 flex items-center justify-center gap-2.5">
          <span
            className={`font-display font-black tracking-tight ${textSizes[size]} ${
              lightText ? 'text-white' : 'text-[var(--ink)]'
            }`}
          >
            LearnPath
          </span>
          <span
            className={`font-mono font-black uppercase rounded-xl bg-gradient-to-r from-[#2D5BFF] via-[#7C3AED] to-[#EC4899] text-white shadow-md shadow-[#2D5BFF]/30 tracking-wider ${badgeSizes[size]}`}
          >
            AI
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {AnimatedIcon}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-display font-black tracking-tight ${textSizes[size]} ${
              lightText ? 'text-white' : 'text-[var(--ink)]'
            }`}
          >
            LearnPath
          </span>
          <span
            className={`font-mono font-black uppercase rounded-lg bg-gradient-to-r from-[#2D5BFF] to-[#7C3AED] text-white shadow-xs tracking-wider ${badgeSizes[size]}`}
          >
            AI
          </span>
        </div>
        <span
          className={`text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase mt-1 ${
            lightText ? 'text-white/80' : 'text-[#2D5BFF]'
          }`}
        >
          Adaptive Python Platform
        </span>
      </div>
    </div>
  );
};
