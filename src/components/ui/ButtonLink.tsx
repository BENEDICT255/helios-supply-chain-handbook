import React from 'react';
import Link from 'next/link';

interface ButtonLinkProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'white' | 'outline';
  className?: string;
  id?: string;
}

export default function ButtonLink({
  href,
  children,
  variant = 'primary',
  className = '',
  id,
}: ButtonLinkProps) {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantStyles: Record<string, string> = {
    primary:
      'bg-[var(--primary-blue)] text-white hover:bg-[var(--dark-blue)] focus:ring-[var(--primary-blue)]',
    secondary:
      'bg-white text-[var(--primary-blue)] border-2 border-[var(--primary-blue)] hover:bg-[var(--pale-blue)] focus:ring-[var(--primary-blue)]',
    white:
      'bg-white text-[var(--primary-blue)] hover:bg-[var(--pale-blue)] focus:ring-white',
    outline:
      'bg-transparent text-[var(--text-primary)] border border-[var(--border-grey)] hover:bg-[var(--light-grey)] focus:ring-[var(--primary-blue)]',
  };

  return (
    <Link
      href={href}
      id={id}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
