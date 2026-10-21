import type { OrderStatus } from "@/lib/api/types";

export const ORDER_STATUSES: readonly OrderStatus[] = [
  "PENDING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const STATUS_TEXT_CLASS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "text-pending",
  PAID: "text-success",
  PROCESSING: "text-primary",
  SHIPPED: "text-primary",
  DELIVERED: "text-success",
  CANCELLED: "text-danger",
  REFUNDED: "text-slate-500",
};

/** Mirrors OrderStatus.allowedNext() on the backend, which remains the authority and rejects anything else. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function nextStatuses(status: OrderStatus): readonly OrderStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

/** Validates a ?status= URL value. */
export function parseStatus(value: string | undefined): OrderStatus | undefined {
  return ORDER_STATUSES.find((status) => status === value);
}
