"use client";

import Link from "next/link";
import { useState } from "react";
import { useProduct } from "@/hooks/useProduct";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/api/cart";
import { isApiClientError } from "@/lib/api/errors";
import { formatPrice } from "@/lib/utils/format";
import { productImageUrls } from "@/lib/utils/images";
import { AddToCartButton } from "./AddToCartButton";
import { ProductGallery } from "./ProductGallery";

export function ProductDetail({ slug }: { slug: string }) {
  const { data: product, isPending, isError, error } = useProduct(slug);
  const [quantity, setQuantity] = useState(1);

  if (isPending) {
    return <div className="intro-y box p-5 mt-5 animate-pulse h-64" aria-busy="true" />;
  }
  if (isError || !product) {
    return (
      <div className="alert alert-danger mt-5" role="alert">
        {isApiClientError(error) ? error.message : "The product could not be loaded."}
      </div>
    );
  }

  const safeQuantity = Math.min(Math.max(1, quantity), MAX_CART_ITEM_QUANTITY);

  return (
    <div className="intro-y box mt-5 p-5 grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <ProductGallery name={product.name} urls={productImageUrls(product.images, product.id)} />
      </div>
      <div className="col-span-12 lg:col-span-8">
        {product.category ? (
          <Link href={`/products?category=${encodeURIComponent(product.category.slug)}`} className="text-primary text-xs">
            {product.category.name}
          </Link>
        ) : null}
        <h1 className="text-2xl font-medium mt-1">{product.name}</h1>
        <div className="text-slate-500 text-xs mt-1">SKU: {product.sku}</div>
        <div className="text-3xl font-medium mt-5">{formatPrice(product.price, product.currency)}</div>
        <div className={`mt-3 font-medium ${product.inStock ? "text-success" : "text-danger"}`}>
          {product.inStock ? "In stock" : "Out of stock"}
        </div>
        {product.description ? <p className="mt-5 leading-relaxed text-slate-600" style={{ whiteSpace: "pre-line" }}>{product.description}</p> : null}
        <div className="flex items-end mt-8">
          <div className="mr-4">
            <label htmlFor="quantity" className="form-label">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={MAX_CART_ITEM_QUANTITY}
              className="form-control w-24"
              value={safeQuantity}
              disabled={!product.inStock}
              onChange={(event) => setQuantity(Number.parseInt(event.target.value, 10) || 1)}
            />
          </div>
          <AddToCartButton
            productId={product.id}
            quantity={safeQuantity}
            disabled={!product.inStock}
            className="btn btn-primary py-2 px-4"
          />
        </div>
      </div>
    </div>
  );
}
