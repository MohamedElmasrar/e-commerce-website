import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminOrderDetail } from "@/features/admin/orders/AdminOrderDetail";
import { parseId } from "@/features/shared/parse-id";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  return <AdminOrderDetail id={id} />;
}
