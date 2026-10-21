import type { Metadata } from "next";
import { CheckoutSuccess } from "@/features/checkout/components/CheckoutResult";
import { parseId } from "@/features/shared/parse-id";

export const metadata: Metadata = { title: "Order confirmation" };

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CheckoutSuccess orderId={parseId((await searchParams).orderId)} />;
}
