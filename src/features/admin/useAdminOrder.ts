import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { OrderStatus, OrderWithItems } from '@/types/database';

interface AdminOrderState {
  order: OrderWithItems | null;
  loading: boolean;
  /** Null on success / not-found; a message string when the fetch errored. */
  error: string | null;
  /** Re-run the fetch (e.g. after a status change). */
  refetch: () => void;
  /** Optimistically apply a new status to the loaded order. */
  setStatus: (status: OrderStatus) => void;
}

/**
 * Load a single order with its line items for the admin invoice / stitching
 * sheet. RLS already lets staff read every order + item, so a plain select with
 * an embedded `order_items(*)` is enough.
 */
export function useAdminOrder(id: string | undefined): AdminOrderState {
  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        setOrder((data as OrderWithItems | null) ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);
  const setStatus = useCallback(
    (status: OrderStatus) => setOrder((o) => (o ? { ...o, status } : o)),
    [],
  );

  return { order, loading, error, refetch, setStatus };
}
