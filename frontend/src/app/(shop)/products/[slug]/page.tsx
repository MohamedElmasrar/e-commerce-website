import type { Metadata } from "next";
import { ProductDetailPage } from "@/features/catalog/pages/ProductDetailPage";

export const metadata: Metadata = { title: "Product" };

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
