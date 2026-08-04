import { isServer, QueryClient } from '@tanstack/react-query';

import { QUERY_STALE_TIME_MS } from '@/modules/providers/constants/query-client.constants';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to avoid refetching on the client immediately.
        staleTime: QUERY_STALE_TIME_MS,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    // Server: always make a new query client so requests don't leak between users.
    return makeQueryClient();
  }
  // Browser: reuse the same client across renders (avoids re-creating on suspense).
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
