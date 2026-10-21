"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/ui/Pagination";
import { OrderStatusBadge } from "@/features/orders/components/OrderStatusBadge";
import { ORDER_STATUSES, STATUS_LABELS } from "@/features/orders/status";
import { pageHref } from "@/features/shared/page-param";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import type { OrderStatus } from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { LoadError, LoadingBox, PageHeader } from "../components/AdminShared";

const PAGE_SIZE = 15;

export function AdminOrders({ page, status }: { page: number; status: OrderStatus | undefined }) {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useAdminOrders(status, page, PAGE_SIZE);
  const extra = { status };

  return (
    <>
      <PageHeader title="Orders">
        <select
          className="form-select box w-full sm:w-52"
          aria-label="Filter by status"
          value={status ?? ""}
          onChange={(event) => router.push(pageHref("/admin/orders", 0, { status: event.target.value || undefined }))}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </PageHeader>
      {isPending ? <LoadingBox /> : null}
      {isError ? <LoadError message="Orders could not be loaded." onRetry={() => refetch()} /> : null}
      {data ? (
        <>
          <div className="intro-y overflow-auto lg:overflow-visible mt-5">
            <table className="table table-report -mt-2">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">ORDER</th>
                  <th className="whitespace-nowrap">CUSTOMER</th>
                  <th className="whitespace-nowrap">DATE</th>
                  <th className="text-center whitespace-nowrap">STATUS</th>
                  <th className="text-right whitespace-nowrap">TOTAL</th>
                  <th className="text-center whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {data.content.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-10">
                      No orders found.
                    </td>
                  </tr>
                ) : null}
                {data.content.map((order) => (
                  <tr key={order.id} className="intro-x">
                    <td className="font-medium whitespace-nowrap">#{order.id}</td>
                    <td className="whitespace-nowrap">{order.shippingAddress?.name ?? `User ${order.userId}`}</td>
                    <td className="whitespace-nowrap">{formatDate(order.createdAt)}</td>
                    <td className="text-center">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="text-right whitespace-nowrap">{formatPrice(order.total, order.currency)}</td>
                    <td className="table-report__action w-40">
                      <div className="flex justify-center items-center">
                        <Link className="flex items-center" href={`/admin/orders/${order.id}`}>
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="intro-y flex flex-wrap sm:flex-row sm:flex-nowrap items-center mt-5">
            <Pagination page={data.page} totalPages={data.totalPages} buildHref={(target) => pageHref("/admin/orders", target, extra)} />
            <div className="text-slate-500 text-xs mt-3 sm:mt-0">{data.totalElements} orders</div>
          </div>
        </>
      ) : null}
    </>
  );
}
