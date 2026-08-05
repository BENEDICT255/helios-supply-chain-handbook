import React from 'react';
import QuickAccessCard from './QuickAccessCard';
import { OpenBookIcon } from '@/components/icons/Icons';

export default function QuickAccessSection() {
  return (
    <section className="bg-white pt-4 pb-12 sm:pt-6 sm:pb-16" id="quick-access-section">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Top Header with Book Icon */}
        <div className="flex flex-col items-center text-center">
          <OpenBookIcon size={32} className="text-[#005B94]" strokeWidth={1.5} />
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#004B87] sm:text-3xl">
            Quick Access
          </h2>
          <p className="mt-2 max-w-xl text-xs sm:text-sm text-gray-600">
            Select a section below or use the search icon in the navigation bar to quickly find information.
          </p>
        </div>

        {/* 3 Equal Cards in a Single Row */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <QuickAccessCard
            imageSrc="/images/Procurement processes.jpeg"
            imageAlt="Procurement Process"
            title="Procurement Process"
            description="Understand the steps from identifying a requirement through approval, sourcing, purchase order and delivery."
            buttonLabel="View Process"
            href="/procurement-process"
            id="qa-procurement"
          />
          <QuickAccessCard
            imageSrc="/images/Delivery timeline.jpeg"
            imageAlt="Delivery Timelines"
            title="Delivery Timelines"
            description="Check the expected lead times for commonly requested goods, services and procurement categories."
            buttonLabel="Browse Timelines"
            href="/delivery-timelines"
            id="qa-delivery"
          />
          <QuickAccessCard
            imageSrc="/images/FAQs.jpeg"
            imageAlt="Frequently Asked Questions"
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
