import type { Metadata } from "next";
import { OrderList } from "@/features/orders/components/OrderList";
import { parsePageParam } from "@/features/shared/page-param";

export const metadata: Metadata = { title: "My Orders" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <OrderList page={parsePageParam((await searchParams).page)} />;
}
