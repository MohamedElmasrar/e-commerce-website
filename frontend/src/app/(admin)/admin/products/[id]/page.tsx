import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/features/admin/products/ProductForm";
import { parseId } from "@/features/shared/parse-id";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const id = parseId((await params).id);
  if (id === null) notFound();
  return <ProductForm productId={id} />;
}
