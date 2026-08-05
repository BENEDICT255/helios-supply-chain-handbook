import React from 'react';
import { SearchIcon } from '@/components/icons/Icons';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  id = 'search-input',
}: SearchInputProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <SearchIcon size={18} className="text-[var(--text-muted)]" />
      </div>
      <input
        type="text"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--border-grey)] bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] transition-colors focus:border-[var(--primary-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/20"
        aria-label={placeholder}
      />
    </div>
  );
}
