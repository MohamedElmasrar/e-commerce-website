import type { Metadata } from "next";
import { CheckoutCancel } from "@/features/checkout/components/CheckoutResult";
import { parseId } from "@/features/shared/parse-id";

export const metadata: Metadata = { title: "Checkout status" };

export default async function CheckoutCancelPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <CheckoutCancel orderId={parseId((await searchParams).orderId)} />;
}
