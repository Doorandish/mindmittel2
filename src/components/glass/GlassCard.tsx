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
  cyan: 'border-t-4 border-t-blue-600',
  indigo: 'border-t-4 border-t-indigo-600',
  emerald: 'border-t-4 border-t-emerald-600',
  none: '',
};

/**
 * Clean, High-Contrast Enterprise Card surface inspired by MindMittel V1.
 */
export function GlassCard({
  children,
  className = '',
  interactive = false,
  accentGlow = 'none',
}: GlassCardProps) {
  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-blue-400'
    : '';

  return (
    <div
      className={`liquid-glass-card ${accentBorderStyles[accentGlow]} ${interactiveClasses} ${className}`}
    >
      {children}
    </div>
  );
}
