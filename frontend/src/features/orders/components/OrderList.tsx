"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/Pagination";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { pageHref } from "@/features/shared/page-param";
import { useOrders } from "@/hooks/useOrders";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { OrderStatusBadge } from "./OrderStatusBadge";

const PAGE_SIZE = 10;

function OrderListContent({ page }: { page: number }) {
  const { data, isPending, isError, refetch } = useOrders(page, PAGE_SIZE);

  if (isPending) return <div className="intro-y box mt-5 p-5 animate-pulse h-48" aria-busy="true" />;
  if (isError || !data) {
    return (
      <div className="alert alert-danger mt-5" role="alert">
        Orders could not be loaded.{" "}
        <button type="button" className="underline" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }
  if (data.content.length === 0) {
    return (
      <div className="intro-y box mt-5 p-10 text-center">
        <div className="text-lg font-medium">You have no orders yet</div>
        <Link href="/products" className="btn btn-primary mt-5">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="intro-y overflow-auto lg:overflow-visible mt-5">
        <table className="table table-report -mt-2">
          <thead>
            <tr>
              <th className="whitespace-nowrap">ORDER</th>
              <th className="whitespace-nowrap">DATE</th>
              <th className="text-center whitespace-nowrap">ITEMS</th>
              <th className="text-center whitespace-nowrap">STATUS</th>
              <th className="text-right whitespace-nowrap">TOTAL</th>
              <th className="text-center whitespace-nowrap">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {data.content.map((order) => (
              <tr key={order.id} className="intro-x">
                <td className="font-medium whitespace-nowrap">#{order.id}</td>
                <td className="whitespace-nowrap">{formatDate(order.createdAt)}</td>
                <td className="text-center">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="text-center">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="text-right whitespace-nowrap">{formatPrice(order.total, order.currency)}</td>
                <td className="table-report__action w-40">
                  <div className="flex justify-center items-center">
                    <Link className="flex items-center" href={`/orders/${order.id}`}>
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
        <Pagination page={data.page} totalPages={data.totalPages} buildHref={(target) => pageHref("/orders", target)} />
        <div className="text-slate-500 text-xs mt-3 sm:mt-0">{data.totalElements} orders</div>
      </div>
    </>
  );
}

export function OrderList({ page }: { page: number }) {
  return (
    <RequireAuth>
      <h2 className="intro-y text-lg font-medium mt-10">My Orders</h2>
      <OrderListContent page={page} />
    </RequireAuth>
  );
}
