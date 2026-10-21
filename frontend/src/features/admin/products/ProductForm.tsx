"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { readFormError } from "@/features/shared/form-errors";
import { useAdminProduct, useCreateProduct, useUpdateProduct } from "@/hooks/useAdminProducts";
import { useCategories } from "@/hooks/useCategories";
import { adminApi } from "@/lib/api/admin";
import type { CategoryResponse, AdminProductResponse } from "@/lib/api/types";
import { LoadError, LoadingBox, PageHeader } from "../components/AdminShared";
import { PendingImages, SavedImages, type PendingImage } from "./ImageManager";
import {
  PRODUCT_FIELDS,
  emptyProductForm,
  toProductRequest,
  validateProductForm,
  type ProductErrors,
  type ProductField,
  type ProductFormValues,
} from "./validation";

function formFromProduct(product: AdminProductResponse): ProductFormValues {
  return {
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    description: product.description ?? "",
    price: String(product.price),
    currency: product.currency,
    categoryId: product.category ? String(product.category.id) : "",
    active: product.active,
    initialStock: "0",
  };
}

function CategoryOptions({ categories }: { categories: CategoryResponse[] }) {
  return (
    <>
      {categories.map((category) => (
        <option key={category.id} value={category.id}>
          {category.name}
        </option>
      ))}
    </>
  );
}

function Form({ product }: { product: AdminProductResponse | null }) {
  const router = useRouter();
  const toast = useToast();
  const mode = product ? "edit" : "create";
  const create = useCreateProduct();
  const update = useUpdateProduct(product?.id ?? 0);
  const { data: categories } = useCategories(true);
  const [values, setValues] = useState<ProductFormValues>(product ? formFromProduct(product) : emptyProductForm);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [general, setGeneral] = useState<string>();
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [createPhase, setCreatePhase] = useState<"saving" | "uploading" | "opening">();
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);
  // Release the preview URLs when the page is left.
  useEffect(() => () => pendingRef.current.forEach((image) => URL.revokeObjectURL(image.preview)), []);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const busy = createPhase !== undefined || update.isPending;

  const fail = (failure: unknown) => {
    const parsed = readFormError(failure, PRODUCT_FIELDS);
    setErrors(parsed.fields);
    setGeneral(parsed.general);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    const found = validateProductForm(values, mode);
    setErrors(found);
    setGeneral(undefined);
    if (Object.keys(found).length > 0) return;
    const payload = toProductRequest(values, mode);

    if (product) {
      update.mutate(payload, { onSuccess: (saved) => toast.success("Product saved", saved.name), onError: fail });
      return;
    }

    setCreatePhase("saving");
    let created: AdminProductResponse;
    try {
      created = await create.mutateAsync(payload);
    } catch (error) {
      fail(error);
      setCreatePhase(undefined);
      return;
    }

    if (pending.length > 0) setCreatePhase("uploading");
    let uploaded = 0;
    for (const image of pending) {
      try {
        await adminApi.products.addImage(created.id, image.file);
        uploaded++;
      } catch {
        break;
      }
    }
    if (uploaded === pending.length) {
      toast.success("Product created", created.name);
    } else {
      toast.warning("Product created", `${uploaded} of ${pending.length} images uploaded. Add the remaining images from the product page.`);
    }
    setCreatePhase("opening");
    router.replace(`/admin/products/${created.id}`);
  };

  const text = (field: ProductField, label: string, extra: { type?: string; help?: string; inputMode?: "decimal" | "numeric" } = {}) => (
    <FormField id={`product-${field}`} label={label} error={errors[field]} help={extra.help}>
      <input
        id={`product-${field}`}
        type={extra.type ?? "text"}
        inputMode={extra.inputMode}
        className="form-control"
        value={values[field as keyof ProductFormValues] as string}
        onChange={(event) => set(field as keyof ProductFormValues, event.target.value as never)}
      />
    </FormField>
  );

  return (
    <>
      <PageHeader title={product ? `Edit product: ${product.name}` : "Add New Product"} />
      <form className="grid grid-cols-11 gap-x-6 mt-5 pb-20" onSubmit={submit} noValidate>
        <div className="intro-y col-span-11 2xl:col-span-9">
          <div className="intro-y box p-5">
            {general ? (
              <div className="alert alert-danger mb-5" role="alert">
                {general}
              </div>
            ) : null}
            <div className="border border-slate-200/60 dark:border-darkmode-400 rounded-md p-5">
              <div className="font-medium text-base pb-5 border-b border-slate-200/60 dark:border-darkmode-400">Product Information</div>
              <div className="mt-5">{text("name", "Product Name")}</div>
              <div className="grid grid-cols-12 gap-4 mt-5">
                <div className="col-span-12 sm:col-span-6">{text("sku", "SKU")}</div>
                <div className="col-span-12 sm:col-span-6">
                  {text("slug", "Slug", { help: "Optional. Generated from the name when empty." })}
                </div>
              </div>
              <div className="mt-5">
                <FormField id="product-categoryId" label="Category" error={errors.categoryId}>
                  <select
                    id="product-categoryId"
                    className="form-select"
                    value={values.categoryId}
                    onChange={(event) => set("categoryId", event.target.value)}
                  >
                    <option value="">Select a category</option>
                    <CategoryOptions categories={categories ?? []} />
                  </select>
                </FormField>
              </div>
              <div className="mt-5">
                <FormField id="product-description" label="Description" error={errors.description}>
                  <textarea
                    id="product-description"
                    className="form-control"
                    rows={5}
                    value={values.description}
                    onChange={(event) => set("description", event.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className="border border-slate-200/60 dark:border-darkmode-400 rounded-md p-5 mt-5">
              <div className="font-medium text-base pb-5 border-b border-slate-200/60 dark:border-darkmode-400">Product Images</div>
              <div className="mt-5">
                {product ? <SavedImages productId={product.id} images={product.images} /> : <PendingImages images={pending} onChange={setPending} busy={busy} />}
              </div>
            </div>

            <div className="border border-slate-200/60 dark:border-darkmode-400 rounded-md p-5 mt-5">
              <div className="font-medium text-base pb-5 border-b border-slate-200/60 dark:border-darkmode-400">Product Pricing and Stock</div>
              <div className="grid grid-cols-12 gap-4 mt-5">
                <div className="col-span-12 sm:col-span-4">{text("price", "Price", { inputMode: "decimal" })}</div>
                <div className="col-span-12 sm:col-span-4">{text("currency", "Currency")}</div>
                {mode === "create" ? (
                  <div className="col-span-12 sm:col-span-4">{text("initialStock", "Initial stock", { inputMode: "numeric" })}</div>
                ) : (
                  <div className="col-span-12 sm:col-span-4">
                    <FormField id="product-stock" label="Stock" help="Change it on the Inventory page.">
                      <input id="product-stock" className="form-control" value={product?.stock ?? 0} disabled readOnly />
                    </FormField>
                  </div>
                )}
              </div>
              <div className="form-check mt-5">
                <input
                  id="product-active"
                  type="checkbox"
                  className="form-check-input"
                  checked={values.active}
                  onChange={(event) => set("active", event.target.checked)}
                />
                <label htmlFor="product-active" className="form-check-label">
                  Active (visible in the shop)
                </label>
              </div>
            </div>

            <div className="flex justify-end flex-col md:flex-row gap-2 mt-5">
              <button type="button" className="btn py-3 border-slate-300 dark:border-darkmode-400 text-slate-500 w-full md:w-52" disabled={busy} onClick={() => router.push("/admin/products")}>
                Back to list
              </button>
              <button type="submit" className="btn py-3 btn-primary w-full md:w-52" disabled={busy}>
                {createPhase === "uploading" ? "Uploading images..." : createPhase === "opening" ? "Opening product..." : busy ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

export function ProductForm({ productId }: { productId: number | null }) {
  const { data: product, isPending, isError, refetch } = useAdminProduct(productId);
  if (productId === null) return <Form product={null} />;
  if (isPending) return <LoadingBox height="h-64" />;
  if (isError || !product) return <LoadError message="The product could not be loaded." onRetry={() => refetch()} />;
  // Remount when another product loads so the form state restarts from its values.
  return <Form key={product.id} product={product} />;
}
