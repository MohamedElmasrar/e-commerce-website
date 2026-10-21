"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { readFormError } from "@/features/shared/form-errors";
import { pageHref } from "@/features/shared/page-param";
import { useAdjustStock, useInventory } from "@/hooks/useInventory";
import type { InventoryResponse } from "@/lib/api/types";
import { LoadError, LoadingBox, PageHeader } from "../components/AdminShared";
import { validateAdjust } from "./validation";

const PAGE_SIZE = 15;

function AdjustForm({ row, onClose }: { row: InventoryResponse; onClose: () => void }) {
  const toast = useToast();
  const adjust = useAdjustStock();
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ delta?: string; note?: string }>({});
  const [general, setGeneral] = useState<string>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateAdjust({ delta, note }, row.quantityOnHand);
    setErrors(found);
    setGeneral(undefined);
    if (Object.keys(found).length > 0) return;
    adjust.mutate(
      { productId: row.productId, payload: { delta: Number(delta), note: note.trim() || null } },
      {
        onSuccess: () => {
          toast.success("Stock updated");
          onClose();
        },
        onError: (failure) => {
          const parsed = readFormError(failure, ["delta", "note"] as const);
          setErrors(parsed.fields);
          setGeneral(parsed.general);
        },
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="modal-header">
        <h2 className="font-medium text-base mr-auto">Adjust stock: {row.name}</h2>
      </div>
      <div className="modal-body">
        {general ? (
          <div className="alert alert-danger mb-4" role="alert">
            {general}
          </div>
        ) : null}
        <div className="mb-3 text-slate-500">On hand: {row.quantityOnHand}</div>
        <FormField id="adjust-delta" label="Change (use a minus sign to remove stock)" error={errors.delta}>
          <input id="adjust-delta" className="form-control" inputMode="numeric" value={delta} onChange={(event) => setDelta(event.target.value)} />
        </FormField>
        <div className="mt-3">
          <FormField id="adjust-note" label="Note (optional)" error={errors.note}>
            <input id="adjust-note" className="form-control" value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>
        </div>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary w-20 mr-1" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary w-20" disabled={adjust.isPending}>
          {adjust.isPending ? "Saving..." : "Apply"}
        </button>
      </div>
    </form>
  );
}

export function AdminInventory({ page, lowStock }: { page: number; lowStock: boolean }) {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useInventory(page, PAGE_SIZE, lowStock);
  const [adjusting, setAdjusting] = useState<InventoryResponse | null>(null);
  const extra = { low: lowStock ? "1" : undefined };

  return (
    <>
      <PageHeader title="Inventory">
        <div className="form-check">
          <input
            id="low-stock-filter"
            type="checkbox"
            className="form-check-input"
            checked={lowStock}
            onChange={(event) => router.push(pageHref("/admin/inventory", 0, { low: event.target.checked ? "1" : undefined }))}
          />
          <label htmlFor="low-stock-filter" className="form-check-label">
            Low stock only
          </label>
        </div>
      </PageHeader>
      {isPending ? <LoadingBox /> : null}
      {isError ? <LoadError message="Inventory could not be loaded." onRetry={() => refetch()} /> : null}
      {data ? (
        <>
          <div className="intro-y overflow-auto lg:overflow-visible mt-5">
            <table className="table table-report -mt-2">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">PRODUCT</th>
                  <th className="whitespace-nowrap">SKU</th>
                  <th className="text-center whitespace-nowrap">ON HAND</th>
                  <th className="text-center whitespace-nowrap">STATUS</th>
                  <th className="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 py-10">
                      {lowStock ? "No products are running low." : "No inventory records."}
                    </td>
                  </tr>
                ) : null}
                {data.content.map((row) => (
                  <tr key={row.productId} className="intro-x">
                    <td className="font-medium whitespace-nowrap">
                      <Link href={`/admin/products/${row.productId}`}>{row.name}</Link>
                    </td>
                    <td className="text-slate-500">{row.sku}</td>
                    <td className="text-center">{row.quantityOnHand}</td>
                    <td className={`text-center ${row.lowStock ? "text-danger" : "text-success"}`}>{row.lowStock ? "Low stock" : "In stock"}</td>
                    <td className="table-report__action w-40">
                      <div className="flex justify-center items-center">
                        <button type="button" className="flex items-center text-primary" onClick={() => setAdjusting(row)}>
                          Adjust stock
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="intro-y flex flex-wrap sm:flex-row sm:flex-nowrap items-center mt-5">
            <Pagination page={data.page} totalPages={data.totalPages} buildHref={(target) => pageHref("/admin/inventory", target, extra)} />
          </div>
        </>
      ) : null}
      <Modal open={adjusting !== null} onClose={() => setAdjusting(null)} label="Adjust stock">
        {adjusting ? <AdjustForm key={adjusting.productId} row={adjusting} onClose={() => setAdjusting(null)} /> : null}
      </Modal>
    </>
  );
}
