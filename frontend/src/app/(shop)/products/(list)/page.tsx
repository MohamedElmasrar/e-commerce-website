import type { Metadata } from "next";
import { ProductListPage } from "@/features/catalog/pages/ProductListPage";

export const metadata: Metadata = { title: "Products" };

export default function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ProductListPage title="Products" searchParams={searchParams} />;
}
