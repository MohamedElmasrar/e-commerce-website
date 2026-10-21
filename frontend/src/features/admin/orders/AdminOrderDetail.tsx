"use client";

import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { OrderSummary } from "@/features/orders/components/OrderSummary";
import { STATUS_LABELS, nextStatuses } from "@/features/orders/status";
import { useAdminOrder, useUpdateOrderStatus } from "@/hooks/useAdminOrders";
import type { OrderResponse, OrderStatus } from "@/lib/api/types";
import { LoadError, LoadingBox, PageHeader } from "../components/AdminShared";

function StatusChanger({ order }: { order: OrderResponse }) {
  const toast = useToast();
  const update = useUpdateOrderStatus(order.id);
  const [choice, setChoice] = useState<OrderStatus | "">("");
  const options = nextStatuses(order.status);

  if (options.length === 0) {
    return <div className="text-slate-500">{STATUS_LABELS[order.status]} is a final status.</div>;
  }
  return (
    <div className="flex items-center gap-2">
      <select
        className="form-select w-48"
        aria-label="New status"
        value={choice}
        onChange={(event) => setChoice(event.target.value as OrderStatus | "")}
      >
        <option value="">Change status...</option>
        {options.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="btn btn-primary"
        disabled={!choice || update.isPending}
        onClick={() =>
          choice &&
          update.mutate(choice, {
            onSuccess: () => {
              setChoice("");
              toast.success("Order status updated");
            },
          })
        }
      >
        {update.isPending ? "Saving..." : "Update"}
      </button>
    </div>
  );
}

export function AdminOrderDetail({ id }: { id: number }) {
  const { data: order, isPending, isError, refetch } = useAdminOrder(id);
  return (
    <>
      <PageHeader title={`Order #${id}`}>
        <Link href="/admin/orders" className="btn btn-outline-secondary shadow-md">
          Back to orders
        </Link>
      </PageHeader>
      {isPending ? <LoadingBox /> : null}
      {isError ? <LoadError message="The order could not be loaded." onRetry={() => refetch()} /> : null}
      {order ? (
        <>
          <div className="intro-y box p-5 mt-5 flex flex-col sm:flex-row sm:items-center">
            <div className="mr-auto mb-3 sm:mb-0 font-medium">Status</div>
            <StatusChanger key={order.status} order={order} />
          </div>
          <OrderSummary order={order} />
        </>
      ) : null}
    </>
  );
}
