import React from 'react';
import IconBadge from '@/components/ui/IconBadge';
import { HandshakeIcon } from '@/components/icons/Icons';

export default function WelcomeSection() {
  return (
    <section className="bg-white" id="welcome-section">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <IconBadge size="lg">
            <HandshakeIcon size={28} className="text-[var(--primary-blue)]" />
          </IconBadge>
          <h2 className="mt-5 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Welcome
          </h2>
          <div className="mt-4 space-y-4 text-base leading-relaxed text-[var(--text-muted)]">
            <p>Welcome to the Helios Towers Supply Chain Handbook.</p>
            <p>
              This handbook provides employees with clear guidance on procurement
              procedures, expected delivery timelines and frequently asked
              questions.
            </p>
            <p>
              Use the navigation menu or the search function to quickly find the
              information you need.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
