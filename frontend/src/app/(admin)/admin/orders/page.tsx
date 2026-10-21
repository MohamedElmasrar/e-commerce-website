import type { Metadata } from "next";
import { AdminOrders } from "@/features/admin/orders/AdminOrders";
import { parseStatus } from "@/features/orders/status";
import { parsePageParam } from "@/features/shared/page-param";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const status = Array.isArray(params.status) ? params.status[0] : params.status;
  return <AdminOrders page={parsePageParam(params.page)} status={parseStatus(status)} />;
}
