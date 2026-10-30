import React from 'react';

// UniGoh belgisi: darvoza (goh) + vodiy + chiqayotgan quyosh
export function LogoMark({ className = 'w-9 h-9' }) {
  return (
    <svg viewBox="0 0 140 140" className={className} aria-hidden="true">
      <rect width="140" height="140" rx="32" fill="#1E3A8A" />
      <path d="M38 122 V72 A32 32 0 0 1 102 72 V122" fill="none" stroke="#FEF3C7" strokeWidth="14" strokeLinecap="round" />
      <circle cx="70" cy="92" r="12" fill="#F59E0B" />
      <path d="M47 118 L60 98 L70 108 L80 98 L93 118 Z" fill="#FEF3C7" />
    </svg>
  );
}

export default function Logo({ size = 'md' }) {
  const mark = size === 'lg' ? 'w-12 h-12' : 'w-9 h-9';
  const text = size === 'lg' ? 'text-3xl' : 'text-2xl';
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="UniGoh">
      <LogoMark className={mark} />
      <span className={`${text} font-extrabold tracking-tight text-brand-800 leading-none`}>
        uni<span className="text-apricot-500">goh</span>
      </span>
    </span>
  );
}
