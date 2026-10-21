"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCategories } from "@/hooks/useCategories";
import type { ProductListParams } from "@/lib/api/types";
import { SORT_OPTIONS, buildProductsHref } from "../search-params";

interface ProductFiltersProps {
  params: ProductListParams;
  totalElements: number;
  from: number;
  to: number;
}

/** Search box, sort select and category chips. All state lives in the URL. */
export function ProductFilters({ params, totalElements, from, to }: ProductFiltersProps) {
  const router = useRouter();
  const { data: categories } = useCategories(true);
  const [term, setTerm] = useState(params.q ?? "");

  const navigate = (next: ProductListParams) => router.push(buildProductsHref({ ...next, page: 0 }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    navigate({ ...params, q: term.trim() || undefined });
  };

  return (
    <>
      <div className="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center mt-2">
        <select
          className="form-select box w-48 mr-2"
          aria-label="Sort products"
          value={params.sort}
          onChange={(event) => navigate({ ...params, sort: event.target.value })}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="hidden md:block mx-auto text-slate-500">
          {totalElements === 0 ? "No entries" : `Showing ${from} to ${to} of ${totalElements} entries`}
        </div>
        <form className="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0" onSubmit={submit} role="search">
          <div className="w-56 relative text-slate-500">
            <input
              type="text"
              className="form-control w-56 box pr-10"
              placeholder="Search..."
              aria-label="Search products"
              value={term}
              onChange={(event) => setTerm(event.target.value)}
            />
            <button type="submit" aria-label="Search" className="absolute my-auto inset-y-0 mr-3 right-0">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
      <div className="intro-y col-span-12 flex flex-wrap items-center" aria-label="Categories">
        <Link
          href={buildProductsHref({ ...params, category: undefined, page: 0 })}
          className={`btn mr-2 mb-2 ${params.category ? "btn-outline-secondary" : "btn-primary"}`}
        >
          All
        </Link>
        {(categories ?? []).map((category) => (
          <Link
            key={category.id}
            href={buildProductsHref({ ...params, category: category.slug, page: 0 })}
            className={`btn mr-2 mb-2 ${params.category === category.slug ? "btn-primary" : "btn-outline-secondary"}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </>
  );
}
