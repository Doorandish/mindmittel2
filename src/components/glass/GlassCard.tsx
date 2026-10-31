import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accentGlow?: 'cyan' | 'indigo' | 'emerald' | 'none';
}

const accentBorderStyles: Record<
  NonNullable<GlassCardProps['accentGlow']>,
  string
> = {
  cyan: 'border-t-2 border-t-cyan-400/60',
  indigo: 'border-t-2 border-t-indigo-400/60',
  emerald: 'border-t-2 border-t-emerald-400/60',
  none: '',
};

/**
 * Reusable Apple-inspired Liquid Glass surface with seam-free GPU compositing,
 * high-contrast borders, and crisp enterprise typography.
 */
export function GlassCard({
  children,
  className = '',
  interactive = false,
  accentGlow = 'none',
}: GlassCardProps) {
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-white/30'
    : '';

  return (
    <div
      className={`liquid-glass-card ${accentBorderStyles[accentGlow]} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
}
