"use client";

import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Pagination } from "@/components/ui/Pagination";
import { useProducts } from "@/hooks/useProducts";
import { isApiClientError } from "@/lib/api/errors";
import type { ProductListParams } from "@/lib/api/types";
import { buildProductsHref } from "../search-params";
import { ProductCard } from "./ProductCard";
import { ProductFilters } from "./ProductFilters";

/** Reads the (server prefetched and hydrated) product page from React Query. */
export function ProductBrowser({ params }: { params: ProductListParams }) {
  const { data, isPending, isError, error, refetch } = useProducts(params);

  const size = data?.size ?? params.size ?? 12;
  const page = data?.page ?? params.page ?? 0;
  const total = data?.totalElements ?? 0;
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min(total, (page + 1) * size);

  return (
    <div className="grid grid-cols-12 gap-6 mt-5">
      <ProductFilters params={params} totalElements={total} from={from} to={to} />
      {isPending
        ? Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)
        : null}
      {isError ? (
        <div className="intro-y col-span-12">
          <div className="alert alert-danger" role="alert">
            {isApiClientError(error) ? error.message : "Products could not be loaded."}{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        </div>
      ) : null}
      {data && data.content.length === 0 ? (
        <div className="intro-y col-span-12 text-center text-slate-500 py-10">No products match your filters.</div>
      ) : null}
      {data?.content.map((product) => <ProductCard key={product.id} product={product} />)}
      {data ? (
        <div className="intro-y col-span-12 flex flex-wrap sm:flex-row sm:flex-nowrap items-center">
          <Pagination
            page={page}
            totalPages={data.totalPages}
            buildHref={(target) => buildProductsHref({ ...params, page: target })}
          />
        </div>
      ) : null}
    </div>
  );
}
