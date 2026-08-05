'use client';

import React, { useState } from 'react';
import { FAQItem } from '@/types';
import { ChevronDownIcon } from '@/components/icons/Icons';
import FAQCategoryFilters from './FAQCategoryFilters';

interface FAQAccordionProps {
  faqs: FAQItem[];
  categories: string[];
}

export default function FAQAccordion({ faqs, categories }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const filteredFaqs = faqs.filter(
    (faq) =>
      selectedCategory === 'All Categories' ||
      faq.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const toggleAccordion = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Category filters */}
      <div className="rounded-xl border border-[var(--border-grey)] bg-white p-4 shadow-xs">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Filter FAQs by Category
        </label>
        <FAQCategoryFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Accordion list */}
      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          const buttonId = `faq-button-${faq.id}`;
          const contentId = `faq-content-${faq.id}`;

          return (
            <div
              key={faq.id}
              className="rounded-xl border border-[var(--border-grey)] bg-white overflow-hidden transition-colors"
            >
              <h3>
                <button
                  type="button"
                  id={buttonId}
                  aria-expanded={isOpen}
                  aria-controls={contentId}
                  onClick={() => toggleAccordion(faq.id)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-semibold text-[var(--text-primary)] hover:bg-[var(--light-grey)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--primary-blue)] transition-colors"
                >
                  <span className="flex items-center gap-3 text-base">
                    {faq.question}
                  </span>
                  <span className="shrink-0 flex items-center justify-center gap-2">
                    <span className="hidden sm:inline-block rounded-md bg-[var(--pale-blue)] px-2.5 py-0.5 text-xs font-medium text-[var(--dark-blue)]">
                      {faq.category}
                    </span>
                    <ChevronDownIcon
                      size={20}
                      className={`text-[var(--text-muted)] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[var(--primary-blue)]' : ''
                      }`}
                    />
                  </span>
                </button>
              </h3>

              <div
                id={contentId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-all duration-200 ease-in-out ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="border-t border-[var(--border-grey)]/60 px-6 py-4 text-sm leading-relaxed text-[var(--text-muted)] bg-[var(--light-grey)]/30">
                    {faq.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
