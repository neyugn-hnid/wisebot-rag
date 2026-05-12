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
      <linearGradient id="blueGrad" x1="0" y1="0" x2="100" y2="100">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="100%" stopColor="#0044ff" />
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
    <rect x="25" y="42" width="50" height="24" rx="12" fill="#0A192F" />

    {/* Cyan eyes */}
    <circle cx="37" cy="52" r="4.5" fill="#00e5ff" />
    <circle cx="63" cy="52" r="4.5" fill="#00e5ff" />

    {/* Smile */}
    <path d="M 45 60 Q 50 64 55 60" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" />

    {/* Ears */}
    <path d="M 15 51 C 9 51 9 61 15 61 Z" fill="#0A192F" />
    <path d="M 85 51 C 91 51 91 61 85 61 Z" fill="#0A192F" />

    {/* Antenna Base */}
    <path d="M 45 28 L 55 28 L 53 24 L 47 24 Z" fill="url(#faceGrad)" />
    
    {/* Antenna Stem */}
    <rect x="48.5" y="12" width="3" height="15" fill="url(#blueGrad)" />
    
    {/* Antenna Top */}
    <circle cx="50" cy="12" r="4.5" fill="url(#blueGrad)" />
    <circle cx="50" cy="12" r="2.5" fill="#00e5ff" />
  </svg>
);

export default function Logo({ className, iconOnly = false, size = 'md', theme = 'dark', customSize }: LogoProps & { customSize?: number }) {
  const sizeClasses: Record<string, number> = {
    sm: 40,
    md: 96,
    lg: 140,
    xl: 180,
  };

  const iconSize = customSize ?? (sizeClasses[size] ?? 72);

  if (iconOnly) {
    return (
      <div className={cn('flex items-center', className)}>
        <CustomRobotLogo size={iconSize} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center', className)}>
      <div style={{ maxWidth: `${iconSize}px`, width: '100%' }}>
        <img
          src="/img/logo.png"
          alt="WiseBot"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          className="object-contain"
        />
      </div>
    </div>
  );
}
