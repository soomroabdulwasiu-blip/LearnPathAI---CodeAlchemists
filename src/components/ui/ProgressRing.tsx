import React, { useState, useEffect } from 'react';
import { getMasteryLevel } from '../../lib/constants';

interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
  color?: string;
  className?: string;
  animate?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 56,
  strokeWidth = 5,
  showText = true,
  color,
  className = '',
  animate = true,
}) => {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const targetOffset = circumference - (normalizedProgress / 100) * circumference;
  const [currentOffset, setCurrentOffset] = useState(animate ? circumference : targetOffset);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentOffset(targetOffset);
    }, 40);
    return () => clearTimeout(timer);
  }, [targetOffset]);

  const mastery = getMasteryLevel(normalizedProgress);
  const strokeColor = color || mastery.color;
  const gradientId = `ring-grad-${size}-${Math.round(normalizedProgress)}`;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-[var(--line)]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          strokeLinecap="round"
          fill="transparent"
          style={{
            transition: 'stroke-dashoffset 0.85s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>
      {showText && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold font-display leading-none text-[var(--ink)]">
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};
