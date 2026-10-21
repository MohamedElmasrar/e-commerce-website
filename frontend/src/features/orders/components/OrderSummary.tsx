import type { OrderResponse } from "@/lib/api/types";
import { formatDate, formatPrice } from "@/lib/utils/format";
import { OrderStatusBadge } from "./OrderStatusBadge";

/** Invoice style summary (invoice-layout-1.html) shared by the customer and admin order pages. */
export function OrderSummary({ order }: { order: OrderResponse }) {
  const address = order.shippingAddress;
  return (
    <div className="intro-y box overflow-hidden mt-5">
      <div className="flex flex-col lg:flex-row pt-10 px-5 sm:px-20 sm:pt-20 lg:pb-20 text-center sm:text-left">
        <div className="font-semibold text-primary text-3xl">INVOICE</div>
        <div className="mt-20 lg:mt-0 lg:ml-auto lg:text-right">
          <div className="text-xl text-primary font-medium">Order #{order.id}</div>
          <div className="mt-1">{formatDate(order.createdAt)}</div>
          <div className="mt-1">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>
      {address ? (
        <div className="px-5 sm:px-16 pb-10 sm:pb-20">
          <div className="text-base text-slate-500">Ship to</div>
          <div className="text-lg font-medium text-primary mt-2">{address.name}</div>
          <div className="mt-1">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
          </div>
          <div className="mt-1">
            {address.city}
            {address.state ? `, ${address.state}` : ""} {address.postalCode}, {address.country}
          </div>
        </div>
      ) : null}
      <div className="px-5 sm:px-16 py-10 sm:py-20">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="border-b-2 dark:border-darkmode-400 whitespace-nowrap">PRODUCT</th>
                <th className="border-b-2 dark:border-darkmode-400 text-right whitespace-nowrap">QTY</th>
                <th className="border-b-2 dark:border-darkmode-400 text-right whitespace-nowrap">PRICE</th>
                <th className="border-b-2 dark:border-darkmode-400 text-right whitespace-nowrap">SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.productId}>
                  <td className="border-b dark:border-darkmode-400">
                    <div className="font-medium whitespace-nowrap">{item.productName}</div>
                    <div className="text-slate-500 text-sm mt-0.5 whitespace-nowrap">SKU {item.sku}</div>
                  </td>
                  <td className="text-right border-b dark:border-darkmode-400 w-32">{item.quantity}</td>
                  <td className="text-right border-b dark:border-darkmode-400 w-32">{formatPrice(item.unitPrice, order.currency)}</td>
                  <td className="text-right border-b dark:border-darkmode-400 w-32 font-medium">
                    {formatPrice(item.lineTotal, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="px-5 sm:px-20 pb-10 sm:pb-20 flex flex-col-reverse sm:flex-row">
        <div className="text-center sm:text-right sm:ml-auto">
          <div className="text-base text-slate-500">Total Amount</div>
          <div className="text-xl text-primary font-medium mt-2">{formatPrice(order.total, order.currency)}</div>
        </div>
      </div>
    </div>
  );
}
