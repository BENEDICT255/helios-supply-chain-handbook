import React from 'react';
import IconBadge from '@/components/ui/IconBadge';
import QuickAccessCard from './QuickAccessCard';
import { OpenBookIcon, ClipboardGearIcon, ClockIcon, QuestionBubbleIcon } from '@/components/icons/Icons';

export default function QuickAccessSection() {
  return (
    <section className="bg-[var(--light-grey)]" id="quick-access-section">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <IconBadge size="sm">
            <OpenBookIcon size={20} className="text-[var(--primary-blue)]" />
          </IconBadge>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Quick Access
          </h2>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-[var(--text-muted)]">
          Select a section below or use the search function to quickly find information.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAccessCard
            icon={<ClipboardGearIcon size={28} className="text-[var(--primary-blue)]" />}
            title="Procurement Process"
            description="Understand the steps from identifying a requirement through approval, sourcing, purchase order and delivery."
            buttonLabel="View Process"
            href="/procurement-process"
            id="qa-procurement"
          />
          <QuickAccessCard
            icon={<ClockIcon size={28} className="text-[var(--primary-blue)]" />}
            title="Delivery Timelines"
            description="Check the expected lead times for commonly requested goods, services and procurement categories."
            buttonLabel="Browse Timelines"
            href="/delivery-timelines"
            id="qa-delivery"
          />
          <QuickAccessCard
            icon={<QuestionBubbleIcon size={28} className="text-[var(--primary-blue)]" />}
            title="Frequently Asked Questions"
            description="Find clear answers to common questions about procurement procedures, timelines and responsibilities."
            buttonLabel="View FAQs"
            href="/faqs"
            id="qa-faqs"
          />
        </div>
      </div>
    </section>
  );
}
