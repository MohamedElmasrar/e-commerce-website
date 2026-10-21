import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { categoriesQuery } from "@/lib/query/queries";
import { productListQuery } from "@/lib/query/queries";
import { createQueryClient } from "@/lib/query/query-client";
import { ProductBrowser } from "../components/ProductBrowser";
import { parseProductSearchParams } from "../search-params";

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Server Component: prefetches the first page and categories, then hydrates React Query on the client. */
export async function ProductListPage({ searchParams, title }: { searchParams: Promise<RawSearchParams>; title: string }) {
  const params = parseProductSearchParams(await searchParams);
  const queryClient = createQueryClient();

  // Errors are left to the client component, which renders them and can retry.
  await Promise.allSettled([
    queryClient.prefetchQuery({ ...productListQuery(params), retry: false }),
    queryClient.prefetchQuery({ ...categoriesQuery(true), retry: false }),
  ]);

  return (
    <>
      <h2 className="intro-y text-lg font-medium mt-10">{title}</h2>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductBrowser params={params} />
      </HydrationBoundary>
    </>
  );
}
