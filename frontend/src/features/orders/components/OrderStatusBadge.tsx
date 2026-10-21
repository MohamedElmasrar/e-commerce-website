import type { OrderStatus } from "@/lib/api/types";
import { STATUS_LABELS, STATUS_TEXT_CLASS } from "../status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`font-medium whitespace-nowrap ${STATUS_TEXT_CLASS[status]}`}>{STATUS_LABELS[status]}</span>;
}
