import { QueryClient } from '@tanstack/react-query';

// Aggressive caching: Pakistani mobile users pay for every MB.
// Catalog data rarely changes within a session — cache it hard.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 min — catalog feels live but doesn't refetch on every nav
      gcTime: 30 * 60 * 1000,          // keep cached for 30 min
      refetchOnWindowFocus: false,     // don't burn data when user tabs back
      retry: 1,
    },
  },
});
