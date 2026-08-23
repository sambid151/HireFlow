import React from 'react';
import { LucideIcon } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'emerald'
  | 'purple'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
  label?: string;
  children?: React.ReactNode;
}

/**
 * Standard HireFlow Button Component
 * Enforces ICON + LABEL structure, preventing accidental duplicate icons or leading '+' symbols.
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  loadingText,
  label,
  children,
  className = '',
  disabled,
  type = 'button',
  ...rest
}) => {
  // Normalize children / label text and sanitize redundant leading '+' if icon is supplied or in button text
  const rawContent = label ?? children;

  const sanitizeContent = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === 'string') {
      // If there's an Icon or standard button, strip accidental leading "+" prefix
      if (node.startsWith('+ ')) {
        return node.slice(2);
      }
      if (node.startsWith('+') && !node.startsWith('+1') && !node.startsWith('+d')) {
        return node.slice(1).trimStart();
      }
    }
    return node;
  };

  const cleanContent = sanitizeContent(rawContent);

  // Variant Styles
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-bold focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-950 shadow-md',
    emerald:
      'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 shadow-xs',
    purple:
      'bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white font-bold focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 shadow-xs',
    secondary:
      'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-slate-400',
    outline:
      'bg-transparent border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-[0.98] text-slate-700 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-slate-400',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.98] text-slate-600 dark:text-slate-300 font-semibold focus:ring-2 focus:ring-slate-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold focus:ring-2 focus:ring-rose-400 shadow-xs',
  };

  // Size Styles
  const sizeStyles: Record<ButtonSize, string> = {
    xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    sm: 'px-3.5 py-1.5 text-xs font-semibold rounded-xl gap-2',
    md: 'px-4 py-2 text-xs sm:text-sm font-bold rounded-xl gap-2',
    lg: 'px-6 py-3 text-sm sm:text-base font-bold rounded-2xl gap-2',
  };

  const iconSizes: Record<ButtonSize, string> = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-4 h-4 stroke-[2.5]',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center transition-all duration-150 cursor-pointer select-none focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className={`border-2 border-current border-t-transparent rounded-full animate-spin shrink-0 ${
              size === 'xs' || size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
            }`}
            aria-hidden="true"
          />
          {loadingText ? (
            <span>{loadingText}</span>
          ) : cleanContent ? (
            <span>{cleanContent}</span>
          ) : null}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <Icon className={`${iconSizes[size]} shrink-0`} aria-hidden="true" />
          )}
          {cleanContent && <span>{cleanContent}</span>}
          {Icon && iconPosition === 'right' && (
            <Icon className={`${iconSizes[size]} shrink-0`} aria-hidden="true" />
          )}
        </>
      )}
    </button>
  );
};
