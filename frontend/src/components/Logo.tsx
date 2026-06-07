import React from 'react';
import { cn } from '../lib/utils';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'light' | 'dark';
}

export const CustomRobotLogo = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    width={size} 
    height={size}
  >
    <defs>
      {/* Updated to Cybernetic Neon emerald-indigo gradient */}
      <linearGradient id="blueGrad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#6366f1" />
      </linearGradient>
      <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="100">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#c4d5e8" />
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.3"/>
      </filter>
    </defs>

    {/* Tail (Chat Bubble point) behind the ring */}
    <path d="M 35 75 L 30 100 L 60 78 Z" fill="url(#blueGrad)" />

    {/* Ring */}
    <path fillRule="evenodd" clipRule="evenodd" d="M50 5C25.147 5 5 25.147 5 50C5 74.853 25.147 95 50 95C74.853 95 95 74.853 95 50C95 25.147 74.853 5 50 5ZM50 17C31.775 17 17 31.775 17 50C17 68.225 31.775 83 50 83C68.225 83 83 68.225 83 50C83 31.775 68.225 17 50 17Z" fill="url(#blueGrad)"/>

    {/* White tail */}
    <path d="M 38 75 L 34 94 L 56 79 Z" fill="url(#faceGrad)" />

    {/* Head shape / Chat Bubble inside */}
    <ellipse cx="50" cy="53" rx="34" ry="29" fill="url(#faceGrad)" filter="url(#shadow)" />

    {/* Dark face visor */}
    <rect x="25" y="42" width="50" height="24" rx="12" fill="#030712" />

    {/* Emerald eyes */}
    <circle cx="37" cy="52" r="4.5" fill="#10b981" />
    <circle cx="63" cy="52" r="4.5" fill="#10b981" />

    {/* Smile */}
    <path d="M 45 60 Q 50 64 55 60" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

    {/* Ears */}
    <path d="M 15 51 C 9 51 9 61 15 61 Z" fill="#030712" />
    <path d="M 85 51 C 91 51 91 61 85 61 Z" fill="#030712" />

    {/* Antenna Base */}
    <path d="M 45 28 L 55 28 L 53 24 L 47 24 Z" fill="url(#faceGrad)" />
    
    {/* Antenna Stem */}
    <rect x="48.5" y="12" width="3" height="15" fill="url(#blueGrad)" />
    
    {/* Antenna Top */}
    <circle cx="50" cy="12" r="4.5" fill="url(#blueGrad)" />
    <circle cx="50" cy="12" r="2.5" fill="#10b981" />
  </svg>
);

export default function Logo({ className, iconOnly = false, size = 'md', theme = 'dark', customSize }: LogoProps & { customSize?: number }) {
  const sizeClasses: Record<string, number> = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 64,
  };

  // Calculate proportional size for the SVG icon
  const iconSize = customSize 
    ? (iconOnly ? customSize : customSize * 0.35) 
    : (sizeClasses[size] ?? 40);

  // Calculate proportional font size
  const fontSize = customSize 
    ? customSize * 0.22 
    : (size === 'sm' ? 14 : size === 'md' ? 18 : size === 'lg' ? 24 : 32);

  if (iconOnly) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <CustomRobotLogo size={iconSize} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 select-none text-left', className)}>
      <CustomRobotLogo size={iconSize} className="shrink-0" />
      <span 
        className={cn(
          "font-extrabold tracking-tight font-sans",
          theme === 'dark' ? "text-white" : "text-slate-900"
        )}
        style={{ fontSize: `${fontSize}px`, lineHeight: '1.2' }}
      >
        Wise<span className="text-emerald-400">Bot</span>
      </span>
    </div>
  );
}
