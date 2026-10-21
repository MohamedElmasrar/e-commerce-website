import type { Metadata } from "next";
import { AdminProductList } from "@/features/admin/products/AdminProductList";
import { parsePageParam } from "@/features/shared/page-param";

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;
  return <AdminProductList page={parsePageParam(params.page)} q={q ?? ""} />;
}
