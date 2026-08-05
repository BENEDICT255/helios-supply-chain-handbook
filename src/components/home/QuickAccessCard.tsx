import React from 'react';
import ButtonLink from '@/components/ui/ButtonLink';
import IconBadge from '@/components/ui/IconBadge';

interface QuickAccessCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  id: string;
}

export default function QuickAccessCard({
  icon,
  title,
  description,
  buttonLabel,
  href,
  id,
}: QuickAccessCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--border-grey)] bg-white p-6 transition-shadow hover:shadow-md">
      <IconBadge size="lg">{icon}</IconBadge>
      <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
        {description}
      </p>
      <div className="mt-6">
        <ButtonLink href={href} variant="primary" id={id}>
          {buttonLabel}
        </ButtonLink>
      </div>
    </div>
  );
}
