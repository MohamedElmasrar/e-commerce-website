"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useToast } from "@/components/ui/Toast";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { OrderSummary } from "@/features/orders/components/OrderSummary";
import { useOrder } from "@/hooks/useOrders";
import { usePayOrder } from "@/hooks/useCheckout";
import type { OrderStatus } from "@/lib/api/types";
import { readPendingOrder } from "../checkout-flow";
import { POLL_LIMIT_MS, shouldKeepPolling } from "../polling";

const subscribeNothing = () => () => {};

/** The ?orderId= value, else the order remembered before the Stripe redirect. undefined while hydrating. */
function usePendingOrderId(fromQuery: number | null): number | null | undefined {
  const stored = useSyncExternalStore<number | null | undefined>(subscribeNothing, readPendingOrder, () => undefined);
  return fromQuery ?? stored;
}

function NoOrder() {
  return (
    <div className="intro-y box mt-5 p-10 text-center">
      <div className="text-lg font-medium">We could not find your order</div>
      <Link href="/orders" className="btn btn-primary mt-5">
        View my orders
      </Link>
    </div>
  );
}

function paymentReceived(status: OrderStatus | undefined) {
  return status === "PAID" || status === "PROCESSING" || status === "SHIPPED" || status === "DELIVERED";
}

function CheckoutConfirmation({ id }: { id: number }) {
  const toast = useToast();
  const notified = useRef(false);
  const [timedOut, setTimedOut] = useState(false);
  const { data: order, isError, isFetching, refetch } = useOrder(id, {
    refetchInterval: (current) => (shouldKeepPolling(current?.status, timedOut) ? 2000 : false),
  });
  const status = order?.status;
  const paid = paymentReceived(status);
  const pending = shouldKeepPolling(status);

  useEffect(() => {
    if (!pending) return;
    const timeout = setTimeout(() => setTimedOut(true), POLL_LIMIT_MS);
    return () => clearTimeout(timeout);
  }, [pending]);

  useEffect(() => {
    if (!paid || notified.current) return;
    notified.current = true;
    toast.success("Payment received", `Order #${id} is confirmed.`);
  }, [id, paid, toast]);

  let title = "Confirming your payment...";
  let message = "This page checks automatically for payment confirmation.";
  let Icon = Clock;
  let iconColor = "text-pending";
  const canCheckStatus = pending && (isError || timedOut);
  if (paid) {
    title = "Payment received";
    message = `Thank you. Order #${id} is confirmed.`;
    Icon = CheckCircle;
    iconColor = "text-success";
  } else if (status === "CANCELLED" || status === "REFUNDED") {
    title = status === "CANCELLED" ? "Order cancelled" : "Payment refunded";
    message = `View order #${id} for details.`;
    Icon = XCircle;
    iconColor = "text-danger";
  } else if (isError) {
    title = "Could not check payment status";
    message = "Check again or view your orders for updates.";
  } else if (timedOut) {
    title = "Payment confirmation is taking longer than expected";
    message = "You can check the status again or return to your orders later.";
  }

  return (
    <>
      <div className="intro-y box mt-5 p-5 flex items-center" role="status">
        <Icon className={`w-10 h-10 mr-4 ${iconColor}`} aria-hidden="true" />
        <div>
          <div className="text-lg font-medium">{title}</div>
          <div className="text-slate-500">{message}</div>
        </div>
      </div>
      {order ? <OrderSummary order={order} /> : null}
      <div className="mt-5 flex flex-wrap gap-2">
        {canCheckStatus ? (
          <button type="button" className="btn btn-primary" disabled={isFetching} onClick={() => refetch()}>
            {isFetching ? "Checking..." : "Check status"}
          </button>
        ) : null}
        <Link href={order ? `/orders/${id}` : "/orders"} className="btn btn-outline-secondary">
          {order ? "View order" : "View my orders"}
        </Link>
        {paid ? <Link href="/products" className="btn btn-outline-secondary">Continue shopping</Link> : null}
      </div>
    </>
  );
}

export function CheckoutSuccess({ orderId }: { orderId: number | null }) {
  const id = usePendingOrderId(orderId);
  return (
    <RequireAuth>
      <h2 className="intro-y text-lg font-medium mt-10">Order confirmation</h2>
      {id === undefined ? <div className="intro-y box mt-5 p-5 animate-pulse h-48" aria-busy="true" /> :
        id === null ? <NoOrder /> : <CheckoutConfirmation key={id} id={id} />}
    </RequireAuth>
  );
}

/** Cancel page: the order stays PENDING_PAYMENT and can be paid again. */
export function CheckoutCancel({ orderId }: { orderId: number | null }) {
  const id = usePendingOrderId(orderId);
  const { data: order } = useOrder(id ?? 0, { enabled: id != null });
  const pay = usePayOrder();
  const paid = paymentReceived(order?.status);
  const canRetry = order?.status === "PENDING_PAYMENT";

  return (
    <RequireAuth>
      <h2 className="intro-y text-lg font-medium mt-10">Checkout status</h2>
      <div className="intro-y box mt-5 p-10 text-center">
        {paid ? <CheckCircle className="w-12 h-12 mx-auto text-success" aria-hidden="true" /> :
          <XCircle className="w-12 h-12 mx-auto text-pending" aria-hidden="true" />}
        <div role="status">
          <div className="text-lg font-medium mt-3">{paid ? "Payment received" : "You left the payment page"}</div>
          <div className="text-slate-500 mt-1">
            {paid ? `Order #${order?.id} is confirmed.` : canRetry
              ? `Order #${order.id} is waiting for payment. You can try again now.`
              : "Check your orders for the latest payment status."}
          </div>
        </div>
        <div className="mt-5">
          {canRetry ? (
            <button type="button" className="btn btn-primary mr-2" disabled={pay.isPending} onClick={() => pay.mutate(order.id)}>
              {pay.isPending ? "Redirecting..." : "Retry payment"}
            </button>
          ) : null}
          <Link href="/orders" className="btn btn-outline-secondary">
            View my orders
          </Link>
        </div>
      </div>
    </RequireAuth>
  );
}
