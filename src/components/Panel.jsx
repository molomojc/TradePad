import React from 'react';

// Corner-bracket panel — the shared building block for the sharp/HUD panel style
// (tight radius, thin border, brackets that light up on hover/focus) used across
// the app instead of the default rounded-3xl glass-card look.
export default function Panel({ children, accent = 'primary', className = '', as: Tag = 'div', ...props }) {
  const bracketColor = accent === 'purple' ? 'group-hover:border-purple-400/80' : 'group-hover:border-primary/80';
  return (
    <Tag
      className={`relative group border border-white/10 rounded-lg bg-white/[0.025] transition-colors duration-300 hover:border-white/20 ${className}`}
      {...props}
    >
      <span className={`pointer-events-none absolute -top-px -left-px w-3 h-3 border-t-2 border-l-2 border-transparent ${bracketColor} transition-colors duration-300`} />
      <span className={`pointer-events-none absolute -top-px -right-px w-3 h-3 border-t-2 border-r-2 border-transparent ${bracketColor} transition-colors duration-300`} />
      <span className={`pointer-events-none absolute -bottom-px -left-px w-3 h-3 border-b-2 border-l-2 border-transparent ${bracketColor} transition-colors duration-300`} />
      <span className={`pointer-events-none absolute -bottom-px -right-px w-3 h-3 border-b-2 border-r-2 border-transparent ${bracketColor} transition-colors duration-300`} />
      {children}
    </Tag>
  );
}