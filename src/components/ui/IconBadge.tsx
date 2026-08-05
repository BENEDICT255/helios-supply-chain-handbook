import React from 'react';

interface IconBadgeProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function IconBadge({ children, size = 'md', className = '' }: IconBadgeProps) {
  const sizeStyles: Record<string, string> = {
    sm: 'h-10 w-10',
    md: 'h-14 w-14',
    lg: 'h-16 w-16',
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[var(--pale-blue)] ${sizeStyles[size]} ${className}`}
    >
      {children}
    </div>
  );
}
