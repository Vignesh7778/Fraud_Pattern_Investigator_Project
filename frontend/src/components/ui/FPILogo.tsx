import React from 'react';

interface FPILogoProps {
  variant?: 'full' | 'mark';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FPILogo: React.FC<FPILogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: variant === 'mark' ? 'w-6 h-6' : 'h-7',
    md: variant === 'mark' ? 'w-8 h-8' : 'h-9',
    lg: variant === 'mark' ? 'w-12 h-12' : 'h-14'
  };

  if (variant === 'mark') {
    return (
      <svg
        className={`${sizeClasses[size]} ${className} shrink-0`}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Fraud Pattern Investigator Mark"
      >
        <defs>
          <linearGradient id="fpi-mark-grad-comp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path d="M22 2 L40 12 L40 32 L22 42 L4 32 L4 12 Z" fill="url(#fpi-mark-grad-comp)" opacity="0.18" stroke="url(#fpi-mark-grad-comp)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M14 16 L22 10 L30 16 L30 28 L22 34 L14 28 Z" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 10 L22 34" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="2 2" />
        <path d="M14 16 L30 28" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="22" cy="22" r="4" fill="#34d399" />
        <circle cx="14" cy="16" r="2.5" fill="#0d9488" />
        <circle cx="30" cy="16" r="2.5" fill="#0d9488" />
      </svg>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <svg
        className={`${sizeClasses[size]} shrink-0`}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Fraud Pattern Investigator"
      >
        <defs>
          <linearGradient id="fpi-full-grad-comp" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0d9488" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path d="M22 2 L40 12 L40 32 L22 42 L4 32 L4 12 Z" fill="url(#fpi-full-grad-comp)" opacity="0.18" stroke="url(#fpi-full-grad-comp)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M14 16 L22 10 L30 16 L30 28 L22 34 L14 28 Z" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 10 L22 34" stroke="#0d9488" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="22" cy="22" r="4" fill="#34d399" />
        <circle cx="14" cy="16" r="2.5" fill="#0d9488" />
        <circle cx="30" cy="16" r="2.5" fill="#0d9488" />
      </svg>
      <div className="font-sans">
        <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm tracking-wider leading-none">FPI</div>
        <div className="text-[9px] font-bold text-teal-600 dark:text-teal-400 tracking-wider uppercase leading-snug mt-0.5">
          Fraud Pattern Investigator
        </div>
      </div>
    </div>
  );
};
