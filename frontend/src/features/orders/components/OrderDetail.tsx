"use client";

import Link from "next/link";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { usePayOrder } from "@/hooks/useCheckout";
import { useCancelOrder, useOrder } from "@/hooks/useOrders";
import { OrderSummary } from "./OrderSummary";

function OrderDetailContent({ id }: { id: number }) {
  const { data: order, isPending, isError } = useOrder(id);
  const pay = usePayOrder();
  const cancel = useCancelOrder();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);

  if (isPending) return <div className="intro-y box mt-5 p-5 animate-pulse h-48" aria-busy="true" />;
  if (isError || !order) {
    return (
      <div className="intro-y box mt-5 p-10 text-center">
        <div className="text-lg font-medium">Order not found</div>
        <Link href="/orders" className="btn btn-primary mt-5">
          Back to orders
        </Link>
      </div>
    );
  }

  const pending = order.status === "PENDING_PAYMENT";
  return (
    <>
      <div className="intro-y flex flex-col sm:flex-row items-center mt-8">
        <h2 className="text-lg font-medium mr-auto">Order #{order.id}</h2>
        <div className="w-full sm:w-auto flex mt-4 sm:mt-0">
          {pending ? (
            <>
              <button type="button" className="btn btn-primary shadow-md mr-2" disabled={pay.isPending} onClick={() => pay.mutate(order.id)}>
                {pay.isPending ? "Redirecting..." : "Pay now"}
              </button>
              <button type="button" className="btn btn-outline-danger shadow-md" onClick={() => setConfirming(true)}>
                Cancel order
              </button>
            </>
          ) : null}
        </div>
      </div>
      <OrderSummary order={order} />
      <ConfirmDialog
        open={confirming}
        title="Cancel this order?"
        message="The reserved items are returned to stock."
        confirmLabel="Cancel order"
        busy={cancel.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() =>
          cancel.mutate(order.id, {
            onSuccess: () => {
              setConfirming(false);
              toast.success("Order cancelled");
            },
            onError: () => setConfirming(false),
          })
        }
      />
    </>
  );
}

export function OrderDetail({ id }: { id: number }) {
  return (
    <RequireAuth>
      <OrderDetailContent id={id} />
    </RequireAuth>
  );
}
