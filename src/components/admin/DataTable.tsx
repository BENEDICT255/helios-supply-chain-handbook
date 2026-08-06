'use client';

import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (item: T) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  className?: string;
}

interface DataTableProps<T extends { id: string; status?: 'published' | 'draft' }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onToggleStatus?: (item: T) => void;
  searchPlaceholder?: string;
  actionsHeader?: string;
  highlightedId?: string | null;
}

export default function DataTable<T extends { id: string; status?: 'published' | 'draft' }>({
  columns,
  data,
  onEdit,
  onDelete,
  onToggleStatus,
  searchPlaceholder = 'Search records...',
  actionsHeader = 'Actions',
  highlightedId,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  React.useEffect(() => {
    if (highlightedId) {
      const targetId = highlightedId === 'new' && data.length > 0 ? data[0].id : highlightedId;
      const el = document.getElementById(`row-${targetId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedId, data]);

  // Filter
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      return columns.some((col) => {
        if (col.searchable === false) return false;
        const val = col.accessor(item);
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(q);
        }
        return false;
      });
    });
  }, [data, columns, searchQuery, statusFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = col.accessor(a);
      const valB = col.accessor(b);

      const strA = typeof valA === 'string' ? valA : String(valA ?? '');
      const strB = typeof valB === 'string' ? valB : String(valB ?? '');

      const comp = strA.localeCompare(strB, undefined, { numeric: true });
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-[var(--border-grey)] bg-white px-3.5 py-2 pl-9 text-xs sm:text-sm text-[var(--text-primary)] placeholder-gray-400 shadow-xs focus:border-[var(--primary-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--primary-blue)]"
          />
          <svg
            className="absolute left-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.35" y2="16.35" />
          </svg>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-medium text-[var(--text-muted)] mr-1">Status:</span>
          {(['all', 'published', 'draft'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-2.5 py-1 font-medium capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-[var(--primary-blue)] text-white'
                  : 'bg-gray-100 text-[var(--text-muted)] hover:bg-gray-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet-like Table Container */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-grey)] bg-white shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-grey)]">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-4 py-3.5 whitespace-nowrap ${col.className || ''} ${
                    col.sortable !== false ? 'cursor-pointer select-none hover:text-[var(--text-primary)]' : ''
                  }`}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-gray-400">
                        {sortKey === col.key ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onToggleStatus) && (
                <th scope="col" className="px-4 py-3.5 text-right whitespace-nowrap">
                  {actionsHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200/80">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (onEdit || onDelete || onToggleStatus ? 1 : 0)}
                  className="px-4 py-8 text-center text-xs text-[var(--text-muted)]"
                >
                  No records match your search or filter criteria.
                </td>
              </tr>
            ) : (
              sortedData.map((item, idx) => {
                const isHighlighted = highlightedId === item.id || (highlightedId === 'new' && idx === 0);
                return (
                  <tr
                    key={item.id}
                    id={`row-${item.id}`}
                    className={`transition-all duration-500 ${
                      isHighlighted
                        ? 'bg-emerald-50/90 ring-2 ring-emerald-500/50 font-medium'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 align-top text-[var(--text-primary)] ${col.className || ''}`}
                    >
                      {col.accessor(item)}
                    </td>
                  ))}

                  {(onEdit || onDelete || onToggleStatus) && (
                    <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {onToggleStatus && item.status && (
                          <button
                            type="button"
                            onClick={() => onToggleStatus(item)}
                            className="rounded px-2 py-1 text-xs font-semibold border border-gray-200 hover:bg-gray-100 transition-colors"
                            title={item.status === 'published' ? 'Unpublish record' : 'Publish record'}
                          >
                            {item.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                        )}
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="rounded p-1 text-[#005B94] hover:bg-blue-50 transition-colors"
                            title="Edit record"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                            </svg>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="rounded p-1 text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete record"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      <div className="text-xs text-[var(--text-muted)] text-right px-1">
        Showing {sortedData.length} of {data.length} records
      </div>
    </div>
  );
}
