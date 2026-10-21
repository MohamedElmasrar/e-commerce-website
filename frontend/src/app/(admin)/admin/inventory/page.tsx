import type { Metadata } from "next";
import { AdminInventory } from "@/features/admin/inventory/AdminInventory";
import { parsePageParam } from "@/features/shared/page-param";

export const metadata: Metadata = { title: "Inventory" };

export default async function AdminInventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  return <AdminInventory page={parsePageParam(params.page)} lowStock={params.low === "1"} />;
}
