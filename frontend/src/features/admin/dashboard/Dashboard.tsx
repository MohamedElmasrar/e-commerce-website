"use client";

import { CreditCard, ShoppingCart, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ORDER_STATUSES, STATUS_LABELS, STATUS_TEXT_CLASS } from "@/features/orders/status";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useInventory } from "@/hooks/useInventory";
import { formatPrice } from "@/lib/utils/format";
import { LoadError, LoadingBox, PageHeader } from "../components/AdminShared";
import { RevenueChart } from "./RevenueChart";

// The stats endpoint reports revenue as a plain number; the shop sells in a single currency.
const CURRENCY = "USD";

function StatCard({ icon, value, label, tone }: { icon: ReactNode; value: string; label: string; tone: string }) {
  return (
    <div className="col-span-12 sm:col-span-6 xl:col-span-3 intro-y">
      <div className="report-box zoom-in">
        <div className="box p-5">
          <div className="flex">
            <span className={tone}>{icon}</span>
          </div>
          <div className="text-3xl font-medium leading-8 mt-6">{value}</div>
          <div className="text-base text-slate-500 mt-1">{label}</div>
        </div>
      </div>
    </div>
  );
}

function LowStock() {
  const { data } = useInventory(0, 5, true);
  return (
    <div className="intro-y box p-5">
      <div className="flex items-center">
        <h3 className="font-medium text-base mr-auto">Low stock</h3>
        <Link href="/admin/inventory?low=1" className="text-primary text-sm">
          View all
        </Link>
      </div>
      {data && data.content.length === 0 ? <div className="text-slate-500 mt-4">All products are well stocked.</div> : null}
      {data?.content.map((row) => (
        <div key={row.productId} className="flex items-center mt-4">
          <div className="mr-auto">
            <div className="font-medium">{row.name}</div>
            <div className="text-slate-500 text-xs">SKU {row.sku}</div>
          </div>
          <div className="text-danger font-medium">{row.quantityOnHand} left</div>
        </div>
      ))}
    </div>
  );
}

export function Dashboard() {
  const { data: stats, isPending, isError, refetch } = useDashboardStats();

  return (
    <>
      <PageHeader title="Dashboard" />
      {isPending ? <LoadingBox height="h-64" /> : null}
      {isError ? <LoadError message="The dashboard could not be loaded." onRetry={() => refetch()} /> : null}
      {stats ? (
        <div className="grid grid-cols-12 gap-6 mt-5">
          <div className="col-span-12">
            <div className="grid grid-cols-12 gap-6">
              <StatCard icon={<CreditCard className="w-7 h-7" />} tone="text-primary" value={formatPrice(stats.totalRevenue, CURRENCY)} label="Total revenue" />
              <StatCard icon={<ShoppingCart className="w-7 h-7" />} tone="text-pending" value={String(stats.orderCount)} label="Orders" />
              <StatCard icon={<Users className="w-7 h-7" />} tone="text-success" value={String(stats.customerCount)} label="Customers" />
              <StatCard icon={<AlertTriangle className="w-7 h-7" />} tone="text-danger" value={String(stats.lowStockCount)} label="Low stock products" />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-8 intro-y">
            <div className="box p-5">
              <h3 className="font-medium text-base mb-4">Revenue, last 30 days</h3>
              <RevenueChart data={stats.revenueLast30Days} currency={CURRENCY} />
            </div>
          </div>
          <div className="col-span-12 lg:col-span-4 intro-y">
            <div className="box p-5">
              <h3 className="font-medium text-base mb-2">Orders by status</h3>
              {ORDER_STATUSES.map((status) => (
                <div key={status} className="flex items-center mt-3">
                  <Link href={`/admin/orders?status=${status}`} className={`mr-auto ${STATUS_TEXT_CLASS[status]}`}>
                    {STATUS_LABELS[status]}
                  </Link>
                  <span className="font-medium">{stats.ordersByStatus[status] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-12 lg:col-span-7 intro-y">
            <div className="box p-5">
              <h3 className="font-medium text-base mb-2">Top products</h3>
              {stats.topProducts.length === 0 ? <div className="text-slate-500 mt-3">No sales yet.</div> : null}
              <div className="overflow-x-auto">
                <table className="table table-report -mt-2">
                  <tbody>
                    {stats.topProducts.map((product) => (
                      <tr key={product.productId} className="intro-x">
                        <td className="font-medium">{product.name}</td>
                        <td className="text-right whitespace-nowrap">{product.unitsSold} sold</td>
                        <td className="text-right whitespace-nowrap">{formatPrice(product.revenue, CURRENCY)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="col-span-12 lg:col-span-5 intro-y">
            <LowStock />
          </div>
        </div>
      ) : null}
    </>
  );
}
