'use client';

import { useState, useEffect, useCallback } from 'react';
import type { DbDeliveryTimeline } from '@/types/database';
import { getAllDeliveryTimelines } from '@/services/deliveryTimelines';

export function useDeliveryTimelines() {
  const [data, setData] = useState<DbDeliveryTimeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const timelines = await getAllDeliveryTimelines();
      setData(timelines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load delivery timelines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const timelines = await getAllDeliveryTimelines();
        if (!ignore) {
          setData(timelines);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Failed to load delivery timelines');
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
