import React from 'react';

interface DepartmentFiltersProps {
  departments: string[];
  selectedDepartment: string;
  onSelectDepartment: (department: string) => void;
}

export default function DepartmentFilters({
  departments,
  selectedDepartment,
  onSelectDepartment,
}: DepartmentFiltersProps) {
  const allDepartments = ['All Departments', ...departments];

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by department">
      {allDepartments.map((dept) => {
        const isSelected = selectedDepartment === dept;
        return (
          <button
            key={dept}
            type="button"
            onClick={() => onSelectDepartment(dept)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] ${
              isSelected
                ? 'bg-[var(--primary-blue)] text-white'
                : 'bg-white text-[var(--text-muted)] border border-[var(--border-grey)] hover:bg-[var(--light-grey)] hover:text-[var(--text-primary)]'
            }`}
            aria-pressed={isSelected}
          >
            {dept}
          </button>
        );
      })}
    </div>
  );
}
