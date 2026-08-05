import React from 'react';
import { Metadata } from 'next';
import PageHeader from '@/components/ui/PageHeader';
import FAQAccordion from '@/components/faqs/FAQAccordion';
import ButtonLink from '@/components/ui/ButtonLink';
import { getPublishedFaqs, getFaqCategories } from '@/services/faqs';
import { faqs as fallbackFaqs, faqCategories as fallbackCategories } from '@/data/faqs';
import type { FAQItem } from '@/types';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Find clear answers to common questions about procurement procedures, delivery timelines and responsibilities.',
};

export const revalidate = 0; // Dynamic server fetching

export default async function FAQPage() {
  let faqItems: FAQItem[] = [];
  let categories: string[] = [];

  try {
    const dbFaqs = await getPublishedFaqs();
    const dbCategories = await getFaqCategories();

    if (dbFaqs && dbFaqs.length > 0) {
      faqItems = dbFaqs.map((faq, idx) => ({
        id: idx + 1,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
      }));
      categories = dbCategories;
    } else {
      faqItems = fallbackFaqs;
      categories = fallbackCategories;
    }
  } catch (err) {
    console.error('Supabase fetch fallback to static data:', err);
    faqItems = fallbackFaqs;
    categories = fallbackCategories;
  }

  return (
    <>
      <PageHeader
        title="Frequently Asked Questions"
        description="Find answers to common questions about procurement processes, delivery timelines and responsibilities."
      />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Accordion List */}
        <FAQAccordion faqs={faqItems} categories={categories} />

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
