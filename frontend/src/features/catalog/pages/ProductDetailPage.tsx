import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { productDetailQuery } from "@/lib/query/queries";
import { isApiClientError } from "@/lib/api/errors";
import { createQueryClient } from "@/lib/query/query-client";
import { ProductDetail } from "../components/ProductDetail";

export async function ProductDetailPage({ slug }: { slug: string }) {
  const queryClient = createQueryClient();
  try {
    await queryClient.fetchQuery({ ...productDetailQuery(slug), retry: false });
  } catch (error) {
    if (isApiClientError(error) && error.isNotFound) notFound();
    // Other failures are retried by the client component.
  }
  return (
    <>
      <h2 className="intro-y text-lg font-medium mt-10">Product</h2>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ProductDetail slug={slug} />
      </HydrationBoundary>
    </>
  );
}
