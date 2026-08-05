import React from 'react';

interface FAQCategoryFiltersProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function FAQCategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
}: FAQCategoryFiltersProps) {
  const allCategories = ['All Categories', ...categories];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter FAQs by category">
      {allCategories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] ${
              isSelected
                ? 'bg-[var(--primary-blue)] text-white'
                : 'bg-white text-[var(--text-muted)] border border-[var(--border-grey)] hover:bg-[var(--light-grey)] hover:text-[var(--text-primary)]'
            }`}
            aria-pressed={isSelected}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
