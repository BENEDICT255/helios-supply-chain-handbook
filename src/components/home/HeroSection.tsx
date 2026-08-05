import React from 'react';
import ButtonLink from '@/components/ui/ButtonLink';

export default function HeroSection() {
  return (
    <section className="bg-[var(--navy)] text-white" id="hero-section">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          Supply Chain Handbook
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-blue-100/80">
          Your guide to procurement procedures, delivery timelines and supply chain processes.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <ButtonLink href="/delivery-timelines" variant="white" id="hero-browse-timelines">
            Browse Delivery Timelines
          </ButtonLink>
          <ButtonLink
            href="/procurement-process"
            variant="secondary"
            className="!border-white/30 !text-white hover:!bg-white/10"
            id="hero-view-procurement"
          >
            View Procurement Process
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
