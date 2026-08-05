'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DbProcurementStep } from '@/types/database';
import { getAllProcurementSteps } from '@/services/procurementSteps';

export function useProcurementSteps() {
  const [data, setData] = useState<DbProcurementStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const steps = await getAllProcurementSteps();
      setData(steps);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load procurement steps');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const steps = await getAllProcurementSteps();
        if (!ignore) {
          setData(steps);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load procurement steps');
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
