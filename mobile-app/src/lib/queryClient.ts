import { QueryClient } from '@tanstack/react-query';

/**
 * Catalog data changes rarely and Pakistani users are often on metered 3G/4G,
 * so we cache hard: long staleTime, keep data in memory, retry sparingly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — treat catalog as fresh
      gcTime: 30 * 60 * 1000, // keep cached pages around for 30 min
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
