import { MutationCache, QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";
import { isApiClientError } from "@/lib/api/errors";
import { reportMutationError } from "./mutation-errors";

const MAX_RETRIES = 2;

/** Do not retry client errors (4xx); retry transient failures a couple of times. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiClientError(error) && error.status >= 400 && error.status < 500) return false;
  return failureCount < MAX_RETRIES;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => reportMutationError(error, mutation.meta),
    }),
    defaultOptions: {
      queries: {
        // A non-zero staleTime stops the client from refetching right after server hydration.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === "pending",
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

/** One client per request on the server, a single shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}
