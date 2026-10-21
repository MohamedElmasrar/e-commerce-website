"use client";

import { CheckSquare, Search, Square, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { pageHref } from "@/features/shared/page-param";
import { useAdminProducts, useDeleteProduct, useToggleProductActive } from "@/hooks/useAdminProducts";
import type { AdminProductResponse } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils/format";
import { productImageUrls } from "@/lib/utils/images";
import { LoadError, LoadingBox } from "../components/AdminShared";

const PAGE_SIZE = 10;

export function AdminProductList({ page, q }: { page: number; q: string }) {
  const router = useRouter();
  const toast = useToast();
  const { data, isPending, isError, refetch } = useAdminProducts({ page, size: PAGE_SIZE, q: q || undefined });
  const toggle = useToggleProductActive();
  const remove = useDeleteProduct();
  const [search, setSearch] = useState(q);
  const [deleting, setDeleting] = useState<AdminProductResponse | null>(null);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    router.push(pageHref("/admin/products", 0, { q: search.trim() }));
  };

  const from = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const to = data ? Math.min(data.totalElements, (data.page + 1) * data.size) : 0;

  return (
    <>
      <h2 className="intro-y text-lg font-medium mt-10">Products</h2>
      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="intro-y col-span-12 flex flex-wrap sm:flex-nowrap items-center mt-2">
          <Link href="/admin/products/new" className="btn btn-primary shadow-md mr-2">
            Add New Product
          </Link>
          <div className="hidden md:block mx-auto text-slate-500">
            {data ? `Showing ${from} to ${to} of ${data.totalElements} entries` : ""}
          </div>
          <form className="w-full sm:w-auto mt-3 sm:mt-0 sm:ml-auto md:ml-0" role="search" onSubmit={submitSearch}>
            <div className="w-56 relative text-slate-500">
              <input
                type="text"
                className="form-control w-56 box pr-10"
                placeholder="Search..."
                aria-label="Search products"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" aria-label="Search" className="absolute my-auto inset-y-0 mr-3 right-0">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
        <div className="intro-y col-span-12">
          {isPending ? <LoadingBox /> : null}
          {isError ? <LoadError message="Products could not be loaded." onRetry={() => refetch()} /> : null}
        </div>
        {data ? (
          <>
            <div className="intro-y col-span-12 overflow-auto lg:overflow-visible">
              <table className="table table-report -mt-2">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap">IMAGES</th>
                    <th className="whitespace-nowrap">PRODUCT NAME</th>
                    <th className="text-center whitespace-nowrap">STOCK</th>
                    <th className="text-center whitespace-nowrap">PRICE</th>
                    <th className="text-center whitespace-nowrap">STATUS</th>
                    <th className="text-center whitespace-nowrap">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-slate-500 py-10">
                        No products found.
                      </td>
                    </tr>
                  ) : null}
                  {data.content.map((product) => (
                    <tr key={product.id} className="intro-x">
                      <td className="w-40">
                        <div className="flex">
                          {productImageUrls(product.images, product.id)
                            .slice(0, 3)
                            .map((src, index) => (
                              <div key={src} className={`w-10 h-10 image-fit zoom-in${index > 0 ? " -ml-5" : ""}`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt={product.name} className="rounded-full" src={src} />
                              </div>
                            ))}
                        </div>
                      </td>
                      <td>
                        <Link href={`/admin/products/${product.id}`} className="font-medium whitespace-nowrap">
                          {product.name}
                        </Link>
                        <div className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                          {product.category?.name ?? "Uncategorized"} · {product.sku}
                        </div>
                      </td>
                      <td className="text-center">{product.stock}</td>
                      <td className="text-center">{formatPrice(product.price, product.currency)}</td>
                      <td className="w-40">
                        <button
                          type="button"
                          className={`flex items-center justify-center mx-auto ${product.active ? "text-success" : "text-slate-500"}`}
                          aria-pressed={product.active}
                          aria-label={`${product.active ? "Deactivate" : "Activate"} ${product.name}`}
                          disabled={toggle.isPending}
                          onClick={() => toggle.mutate(product, {
                            onSuccess: (saved) => toast.success(saved.active ? "Product activated" : "Product deactivated", saved.name),
                          })}
                        >
                          {product.active ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
                          {product.active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="table-report__action w-56">
                        <div className="flex justify-center items-center">
                          <Link className="flex items-center mr-3" href={`/admin/products/${product.id}`}>
                            <CheckSquare className="w-4 h-4 mr-1" /> Edit
                          </Link>
                          <button type="button" className="flex items-center text-danger" onClick={() => setDeleting(product)}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="intro-y col-span-12 flex flex-wrap sm:flex-row sm:flex-nowrap items-center">
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                buildHref={(target) => pageHref("/admin/products", target, { q: q || undefined })}
              />
            </div>
          </>
        ) : null}
      </div>
      <ConfirmDialog
        open={deleting !== null}
        title="Delete this product?"
        message={deleting ? `"${deleting.name}" will be removed from the catalog.` : undefined}
        busy={remove.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (!deleting) return;
          remove.mutate(deleting.id, {
            onSuccess: () => toast.success("Product deleted"),
            onSettled: () => setDeleting(null),
          });
        }}
      />
    </>
  );
}

