import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderDetail } from "@/features/orders/components/OrderDetail";
import { parseId } from "@/features/shared/parse-id";

export const metadata: Metadata = { title: "Order" };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  return <OrderDetail id={id} />;
}
