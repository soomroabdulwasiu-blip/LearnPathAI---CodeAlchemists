import React, { useState, useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'interactive' | 'glass';
  glowEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  className,
  variant = 'default',
  glowEffect = true,
  children,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (cardRef.current && (variant === 'interactive' || glowEffect)) {
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
        setIsHovered(true);
      }
      onMouseMove?.(e);
    },
    [variant, glowEffect, onMouseMove]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setIsHovered(false);
      setMousePos(null);
      onMouseLeave?.(e);
    },
    [onMouseLeave]
  );

  const base =
    'relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-6 transition-all duration-300 ease-out';

  const variants = {
    default:
      'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:border-[var(--line)]',
    surface:
      'shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)]',
    interactive:
      'shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 hover:border-[#2D5BFF]/45 cursor-pointer active:translate-y-0 active:scale-[0.99] active:shadow-md',
    glass:
      'bg-[var(--surface)]/80 backdrop-blur-xl shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:-translate-y-1 hover:border-[#7C3AED]/40',
  };

  const isInteractive = variant === 'interactive' || glowEffect;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={twMerge(clsx(base, variants[variant], className))}
      {...props}
    >
      {isInteractive && mousePos && isHovered && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(380px circle at ${mousePos.x}px ${mousePos.y}px, rgba(45, 91, 255, 0.08), transparent 75%)`,
          }}
        />
      )}
      <div className="relative z-1">{children}</div>
    </div>
  );
};
