import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { CategoryTable } from "@/features/catalog/components/CategoryTable";
import { categoriesQuery } from "@/lib/query/queries";
import { createQueryClient } from "@/lib/query/query-client";

export const metadata: Metadata = { title: "Categories" };

// Data comes from the live backend, so never freeze it at build time.
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const queryClient = createQueryClient();
  await queryClient.prefetchQuery({ ...categoriesQuery(false), retry: false });
  return (
    <>
      <h2 className="intro-y text-lg font-medium mt-10">Categories</h2>
      <div className="grid grid-cols-12 gap-6 mt-5">
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CategoryTable />
        </HydrationBoundary>
      </div>
    </>
  );
}
