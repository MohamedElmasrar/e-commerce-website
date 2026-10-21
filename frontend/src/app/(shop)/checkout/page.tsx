import type { Metadata } from "next";
import { CheckoutForm } from "@/features/checkout/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return <CheckoutForm />;
}
