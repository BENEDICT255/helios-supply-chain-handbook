'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DbFaq } from '@/types/database';
import { getAllFaqs } from '@/services/faqs';

export function useFaqs() {
  const [data, setData] = useState<DbFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const faqs = await getAllFaqs();
      setData(faqs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const faqs = await getAllFaqs();
        if (!ignore) {
          setData(faqs);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load FAQs');
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  return { data, loading, error, refetch: fetchData };
}
