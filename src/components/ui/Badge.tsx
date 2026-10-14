import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const base =
    'inline-flex items-center font-medium rounded-full border transition-colors select-none';

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantClasses = {
    default: 'bg-[var(--surface-muted)] text-[var(--ink)] border-[var(--line)]',
    outline: 'bg-transparent text-[var(--muted)] border-[var(--line)]',
    success: 'bg-[#12C99B]/15 text-[#0E9D79] dark:text-[#12C99B] border-[#12C99B]/30',
    warning: 'bg-[#FFB92E]/15 text-[#C48500] dark:text-[#FFB92E] border-[#FFB92E]/30',
    danger: 'bg-[#FF6B57]/15 text-[#D9422C] dark:text-[#FF6B57] border-[#FF6B57]/30',
    info: 'bg-[#29B6F6]/15 text-[#0284C7] dark:text-[#29B6F6] border-[#29B6F6]/30',
  };

  return (
    <span
      className={twMerge(clsx(base, sizeClasses[size], variantClasses[variant], className))}
      {...props}
    >
      {children}
    </span>
  );
};
