import React from 'react';
import SearchInput from '@/components/ui/SearchInput';

interface DeliverySearchProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DeliverySearch({ value, onChange }: DeliverySearchProps) {
  return (
    <SearchInput
      value={value}
      onChange={onChange}
      placeholder="Search items, departments, categories, requirements or notes..."
      id="delivery-search"
    />
  );
}
