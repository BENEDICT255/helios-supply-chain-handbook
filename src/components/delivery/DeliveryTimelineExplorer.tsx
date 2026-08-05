'use client';

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { DeliveryTimelineItem } from '@/types';
import DeliverySearch from './DeliverySearch';
import DepartmentFilters from './DepartmentFilters';
import DeliveryItemCard from './DeliveryItemCard';
import DeliveryItemTable from './DeliveryItemTable';
import EmptyState from '@/components/ui/EmptyState';

interface DeliveryTimelineExplorerProps {
  items: DeliveryTimelineItem[];
  departments: string[];
}

export default function DeliveryTimelineExplorer({
  items,
  departments,
}: DeliveryTimelineExplorerProps) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams ? searchParams.get('search') || '' : '';

  const [searchQuery, setSearchQuery] = useState(urlQuery);
  const [prevUrlQuery, setPrevUrlQuery] = useState(urlQuery);
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');

  if (urlQuery !== prevUrlQuery) {
    setPrevUrlQuery(urlQuery);
    setSearchQuery(urlQuery);
  }

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesDept =
        selectedDepartment === 'All Departments' ||
        item.department.toLowerCase() === selectedDepartment.toLowerCase();

      if (!matchesDept) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        item.item.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.requirements.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedDepartment]);

  const hasActiveFilters = searchQuery !== '' || selectedDepartment !== 'All Departments';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('All Departments');
  };

  return (
    <div className="space-y-6" id="delivery-timeline-explorer">
      {/* Search and Filters Controls */}
      <div className="rounded-xl border border-[var(--border-grey)] bg-white p-5 shadow-xs space-y-4">
        <div>
          <label htmlFor="delivery-search" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Search Items & Categories
          </label>
          <DeliverySearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Filter by Department
          </label>
          <DepartmentFilters
            departments={departments}
            selectedDepartment={selectedDepartment}
            onSelectDepartment={setSelectedDepartment}
          />
        </div>
      </div>

      {/* Result Count and Clear Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-muted)] px-1">
        <div>
          Showing <span className="font-bold text-[var(--text-primary)]">{filteredItems.length}</span>{' '}
          {filteredItems.length === 1 ? 'item' : 'items'}
          {hasActiveFilters && (
            <span>
              {' '}
              matching filter criteria
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs font-semibold text-[#005B94] hover:underline focus:outline-none focus:ring-2 focus:ring-[#005B94] rounded px-2 py-1"
            id="clear-delivery-filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Display Results */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No delivery timelines found"
          message="No items matched your search query or department filter. Try clearing filters or searching for another term."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <DeliveryItemTable items={filteredItems} />
          </div>

          {/* Mobile/Tablet Card Grid View */}
          <div className="grid gap-4 md:hidden">
            {filteredItems.map((item) => (
              <DeliveryItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
