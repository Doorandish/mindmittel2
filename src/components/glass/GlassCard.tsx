import React from 'react';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  accentGlow?: 'cyan' | 'indigo' | 'emerald' | 'none';
}

const glowStyles: Record<NonNullable<GlassCardProps['accentGlow']>, string> = {
  cyan: 'before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-cyan-400/20 before:to-transparent before:pointer-events-none',
  indigo:
    'before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-indigo-400/20 before:to-transparent before:pointer-events-none',
  emerald:
    'before:absolute before:-inset-px before:rounded-2xl before:bg-gradient-to-b before:from-emerald-400/20 before:to-transparent before:pointer-events-none',
  none: '',
};

/**
 * Reusable Apple-inspired Liquid Glass surface with frosted blur,
 * subtle top-edge specular reflection, and responsive touch feedback.
 */
export function GlassCard({
  children,
  className = '',
  interactive = false,
  accentGlow = 'none',
}: GlassCardProps) {
  const interactiveClasses = interactive
    ? 'cursor-pointer active:scale-[0.99] hover:border-white/25'
    : '';

  return (
    <div
      className={`relative overflow-hidden liquid-glass-card ${glowStyles[accentGlow]} ${interactiveClasses} ${className}`}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
