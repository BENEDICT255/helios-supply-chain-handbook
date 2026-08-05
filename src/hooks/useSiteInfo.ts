'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DbSiteInformation } from '@/types/database';
import { getSiteInformation } from '@/services/siteInfo';

export function useSiteInfo() {
  const [data, setData] = useState<DbSiteInformation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const info = await getSiteInformation();
      setData(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load site information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const info = await getSiteInformation();
        if (!ignore) {
          setData(info);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load site information');
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
