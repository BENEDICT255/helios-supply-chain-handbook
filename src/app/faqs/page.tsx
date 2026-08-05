import React from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import FAQAccordion from '@/components/faqs/FAQAccordion';
import ButtonLink from '@/components/ui/ButtonLink';
import { faqs, faqCategories } from '@/data/faqs';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find clear answers to common questions about procurement procedures, delivery timelines and responsibilities.',
};

export default function FAQPage() {
  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about procurement processes, delivery timelines and responsibilities."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Accordion List */}
        <FAQAccordion faqs={faqs} categories={faqCategories} />

        {/* Still Need Help callout */}
        <div className="rounded-xl border border-[var(--border-grey)] bg-[var(--light-grey)] p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Still need help?
          </h2>
          <p className="text-sm text-[var(--text-muted)] max-w-md mx-auto">
            If you cannot find the answer to your question in our FAQs, please contact the Supply Chain team directly.
          </p>
          <div className="pt-2">
            <ButtonLink href="/contact" variant="primary" id="faq-contact-btn">
              Contact Supply Chain
            </ButtonLink>
          </div>
        </div>
      </div>
    </>
  );
}
