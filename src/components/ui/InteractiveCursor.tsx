import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export const InteractiveCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Raw mouse coordinates
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  // Smooth springs for outer aura & follower
  const springConfig = { damping: 28, stiffness: 350, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Slower ambient aura spring
  const auraConfig = { damping: 40, stiffness: 180, mass: 0.8 };
  const auraX = useSpring(mouseX, auraConfig);
  const auraY = useSpring(mouseY, auraConfig);

  useEffect(() => {
    // Detect touch / coarse pointer devices
    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0)
    ) {
      setIsTouchDevice(true);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      // Check if hovering interactive element
      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = Boolean(
          target.closest('button') ||
          target.closest('a') ||
          target.closest('input') ||
          target.closest('select') ||
          target.closest('textarea') ||
          target.closest('[role="button"]') ||
          target.closest('.cursor-pointer') ||
          target.closest('[data-interactive="true"]') ||
          target.getAttribute('role') === 'button' ||
          window.getComputedStyle(target).cursor === 'pointer'
        );
        setIsHovered(isInteractive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsHovered(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible, mouseX, mouseY]);

  if (isTouchDevice || !isVisible) {
    return null;
  }

  return (
    <>
      {/* 1. Ambient Cursor Spotlight everywhere mouse moves */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-30 select-none overflow-hidden"
        style={{
          x: auraX,
          y: auraY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          className="w-[450px] h-[450px] rounded-full opacity-25 dark:opacity-15 blur-3xl pointer-events-none transition-opacity duration-300"
          style={{
            background: isHovered
              ? 'radial-gradient(circle, rgba(45, 91, 255, 0.35) 0%, rgba(6, 182, 212, 0.15) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(45, 91, 255, 0.22) 0%, rgba(139, 92, 246, 0.08) 45%, transparent 70%)',
          }}
        />
      </motion.div>

      {/* 2. Outer Smooth Following Ring */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-50 select-none"
        style={{
          x: smoothX,
          y: smoothY,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: isClicking ? 0.8 : isHovered ? 1.6 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 400,
        }}
      >
        <div
          className={`rounded-full transition-all duration-200 ${
            isHovered
              ? 'w-9 h-9 border-2 border-[#2D5BFF] bg-[#2D5BFF]/10 shadow-lg shadow-[#2D5BFF]/20'
              : 'w-7 h-7 border border-[#2D5BFF]/60 dark:border-[#2D5BFF]/80 bg-transparent'
          }`}
        />
      </motion.div>

      {/* 3. Precision Central Dot */}
      <motion.div
        aria-hidden="true"
        className="fixed top-0 left-0 pointer-events-none z-50 select-none"
        style={{
          x: mouseX,
          y: mouseY,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: isClicking ? 0.6 : isHovered ? 0.3 : 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 500,
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-[#2D5BFF] shadow-sm shadow-[#2D5BFF]" />
      </motion.div>
    </>
  );
};
