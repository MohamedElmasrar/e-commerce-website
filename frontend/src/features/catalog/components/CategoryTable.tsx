"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { isApiClientError } from "@/lib/api/errors";
import type { CategoryResponse } from "@/lib/api/types";

function Rows({ categories, depth }: { categories: CategoryResponse[]; depth: number }) {
  return (
    <>
      {categories.map((category) => (
        <CategoryRow key={category.id} category={category} depth={depth} />
      ))}
    </>
  );
}

function CategoryRow({ category, depth }: { category: CategoryResponse; depth: number }) {
  return (
    <>
      <tr className="intro-x">
        <td>
          <Link href={`/products?category=${encodeURIComponent(category.slug)}`} className="font-medium whitespace-nowrap" style={{ paddingLeft: depth * 24 }}>
            {category.name}
          </Link>
          {category.description ? <div className="text-slate-500 text-xs whitespace-nowrap mt-0.5" style={{ paddingLeft: depth * 24 }}>{category.description}</div> : null}
        </td>
        <td className="text-slate-500">{category.slug}</td>
        <td className="text-center">{category.productCount}</td>
        <td className="table-report__action w-56">
          <div className="flex justify-center items-center">
            <Link className="flex items-center text-primary" href={`/products?category=${encodeURIComponent(category.slug)}`}>
              Browse products
            </Link>
          </div>
        </td>
      </tr>
      <Rows categories={category.children} depth={depth + 1} />
    </>
  );
}

export function CategoryTable() {
  const { data, isPending, isError, error } = useCategories(false);
  if (isPending) return <div className="intro-y col-span-12 box p-5 animate-pulse h-48" aria-busy="true" />;
  if (isError) {
    return (
      <div className="intro-y col-span-12 alert alert-danger" role="alert">
        {isApiClientError(error) ? error.message : "Categories could not be loaded."}
      </div>
    );
  }
  return (
    <div className="intro-y col-span-12 overflow-auto lg:overflow-visible">
      <table className="table table-report -mt-2">
        <thead>
          <tr>
            <th className="whitespace-nowrap">CATEGORY NAME</th>
            <th className="whitespace-nowrap">SLUG</th>
            <th className="text-center whitespace-nowrap">PRODUCTS</th>
            <th className="text-center whitespace-nowrap">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          <Rows categories={data} depth={0} />
        </tbody>
      </table>
    </div>
  );
}
