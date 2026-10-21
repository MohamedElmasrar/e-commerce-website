import { Eye, Link as LinkIcon, CheckSquare } from "lucide-react";
import Link from "next/link";
import type { ProductResponse } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils/format";
import { productImageUrls } from "@/lib/utils/images";
import { AddToCartButton } from "./AddToCartButton";

/** Card markup from the template product grid. */
export function ProductCard({ product }: { product: ProductResponse }) {
  const [image] = productImageUrls(product.images, product.id);
  return (
    <div className="intro-y col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3">
      <div className="box">
        <div className="p-5">
          <div className="h-40 2xl:h-56 image-fit rounded-md overflow-hidden before:block before:absolute before:w-full before:h-full before:top-0 before:left-0 before:z-10 before:bg-gradient-to-t before:from-black before:to-black/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={product.name} className="rounded-md" src={image} />
            {!product.inStock ? (
              <span className="absolute top-0 bg-danger text-white text-xs m-5 px-2 py-1 rounded z-10">Out of stock</span>
            ) : null}
            <div className="absolute bottom-0 text-white px-5 pb-6 z-10">
              <Link href={`/products/${product.slug}`} className="block font-medium text-base">
                {product.name}
              </Link>
              <span className="text-white/90 text-xs mt-3">{product.category?.name ?? "Uncategorized"}</span>
            </div>
          </div>
          <div className="text-slate-600 dark:text-slate-500 mt-5">
            <div className="flex items-center">
              <LinkIcon className="w-4 h-4 mr-2" /> Price: {formatPrice(product.price, product.currency)}
            </div>
            <div className="flex items-center mt-2">
              <CheckSquare className="w-4 h-4 mr-2" /> Status: {product.inStock ? "In stock" : "Out of stock"}
            </div>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end items-center p-5 border-t border-slate-200/60 dark:border-darkmode-400">
          <Link className="flex items-center text-primary mr-auto" href={`/products/${product.slug}`}>
            <Eye className="w-4 h-4 mr-1" /> Preview
          </Link>
          <AddToCartButton productId={product.id} disabled={!product.inStock} className="btn btn-primary py-1 px-2" label="Add" />
        </div>
      </div>
    </div>
  );
}
