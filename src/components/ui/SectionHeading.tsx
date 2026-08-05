import React from 'react';

interface SectionHeadingProps {
  children: React.ReactNode;
  className?: string;
}

export default function SectionHeading({ children, className = '' }: SectionHeadingProps) {
  return (
    <h2
      className={`text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl ${className}`}
    >
      {children}
    </h2>
  );
}
