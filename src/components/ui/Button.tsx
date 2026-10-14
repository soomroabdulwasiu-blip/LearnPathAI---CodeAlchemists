import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2, Sparkles } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'primary'
    | 'ai'
    | 'ai-solid'
    | 'secondary'
    | 'ghost'
    | 'outline'
    | 'success'
    | 'warning'
    | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  withSparkle?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      withSparkle = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium transition-all duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5BFF] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 disabled:hover:translate-y-0 disabled:hover:shadow-none active:scale-[0.98] active:translate-y-0 relative overflow-hidden';

    const sizeClasses = {
      sm: 'h-8 px-3 text-xs rounded-xl gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-2xl gap-2.5 font-semibold',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    const variantClasses = {
      primary:
        'bg-gradient-to-r from-[#2D5BFF] via-[#4338CA] to-[#6D28D9] hover:from-[#204AE0] hover:via-[#3730A3] hover:to-[#5B21B6] text-white shadow-md shadow-[#2D5BFF]/25 hover:shadow-lg hover:shadow-[#2D5BFF]/35 hover:-translate-y-0.5 active:bg-[#1E40AF]',
      ai:
        'bg-gradient-to-r from-[#2D5BFF]/10 via-[#7C3AED]/15 to-[#8B5CF6]/10 hover:from-[#2D5BFF]/20 hover:via-[#7C3AED]/25 hover:to-[#8B5CF6]/20 text-[#2D5BFF] dark:text-[#A78BFA] border border-[#7C3AED]/30 hover:border-[#7C3AED]/60 shadow-xs hover:shadow-md hover:shadow-[#7C3AED]/20 hover:-translate-y-0.5 group',
      'ai-solid':
        'bg-gradient-to-r from-[#2D5BFF] via-[#7C3AED] to-[#9333EA] hover:from-[#204AE0] hover:via-[#6D28D9] hover:to-[#7E22CE] text-white shadow-md shadow-[#7C3AED]/30 hover:shadow-lg hover:shadow-[#7C3AED]/40 hover:-translate-y-0.5 group',
      secondary:
        'bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-hover)] border border-[var(--line)] hover:border-[#2D5BFF]/30 shadow-xs hover:shadow-sm hover:-translate-y-0.5',
      ghost:
        'bg-transparent text-[var(--ink)] hover:bg-[var(--surface-hover)] hover:text-[#2D5BFF]',
      outline:
        'bg-transparent text-[var(--ink)] border border-[var(--line)] hover:border-[#2D5BFF] hover:text-[#2D5BFF] hover:bg-[#2D5BFF]/5 hover:-translate-y-0.5',
      success:
        'bg-[#10B981] hover:bg-[#059669] text-white shadow-sm shadow-[#10B981]/25 hover:shadow-md hover:shadow-[#10B981]/35 hover:-translate-y-0.5',
      warning:
        'bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-sm shadow-[#F59E0B]/25 hover:shadow-md hover:shadow-[#F59E0B]/35 hover:-translate-y-0.5',
      danger:
        'bg-[#FF6B57] hover:bg-[#E85642] text-white shadow-sm shadow-[#FF6B57]/25 hover:shadow-md hover:shadow-[#FF6B57]/35 hover:-translate-y-0.5',
    };

    const isAIVariant = variant === 'ai' || variant === 'ai-solid' || withSparkle;

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(clsx(baseClasses, sizeClasses[size], variantClasses[variant], className))}
        {...props}
      >
        {isAIVariant && (
          <span
            aria-hidden="true"
            className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          />
        )}
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : isAIVariant && withSparkle ? (
          <Sparkles className="w-4 h-4 text-violet-300 group-hover:rotate-12 transition-transform shrink-0" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
