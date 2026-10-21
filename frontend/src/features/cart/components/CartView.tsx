"use client";

import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/Toast";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { useCart, useClearCart, useRemoveCartItem, useUpdateCartItem } from "@/hooks/useCart";
import { MAX_CART_ITEM_QUANTITY } from "@/lib/api/cart";
import type { CartItem } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils/format";
import { placeholderImage } from "@/lib/utils/images";

function CartRow({ item }: { item: CartItem }) {
  const toast = useToast();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const set = (quantity: number) => update.mutate({ productId: item.productId, quantity });

  const removeItem = async () => {
    try {
      // The optimistic update unmounts this row before the request finishes.
      await remove.mutateAsync(item.productId);
      toast.success("Removed from cart", item.name);
    } catch {
      // The mutation error handler reports the failure after the row is restored.
    }
  };

  return (
    <tr className="intro-x">
      <td className="w-40">
        <div className="flex">
          <div className="w-10 h-10 image-fit zoom-in">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={item.name} className="rounded-full" src={placeholderImage(item.productId)} />
          </div>
        </div>
      </td>
      <td>
        <Link href={`/products/${item.slug}`} className="font-medium whitespace-nowrap">
          {item.name}
        </Link>
        <div className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
          {formatPrice(item.unitPrice, item.currency)} each
        </div>
      </td>
      <td className="text-center">
        <div className="flex items-center justify-center">
          <button
            type="button"
            className="btn btn-outline-secondary px-2"
            aria-label={`Decrease quantity of ${item.name}`}
            disabled={item.quantity <= 1}
            onClick={() => set(item.quantity - 1)}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-medium" aria-live="polite">
            {item.quantity}
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary px-2"
            aria-label={`Increase quantity of ${item.name}`}
            disabled={update.isPending || !item.canIncreaseQuantity || item.quantity >= MAX_CART_ITEM_QUANTITY}
            onClick={() => set(item.quantity + 1)}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </td>
      <td className="text-right">{formatPrice(item.lineTotal, item.currency)}</td>
      <td className="table-report__action w-16">
        <button
          type="button"
          className="flex items-center text-danger"
          aria-label={`Remove ${item.name}`}
          onClick={removeItem}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function CartContent() {
  const toast = useToast();
  const { data: cart, isPending, isError, refetch } = useCart();
  const clear = useClearCart();

  if (isPending) return <div className="intro-y box mt-5 p-5 animate-pulse h-48" aria-busy="true" />;
  if (isError || !cart) {
    return (
      <div className="alert alert-danger mt-5" role="alert">
        The cart could not be loaded.{" "}
        <button type="button" className="underline" onClick={() => refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="intro-y box mt-5 p-10 text-center">
        <ShoppingCart className="w-12 h-12 mx-auto text-slate-400" />
        <div className="text-lg font-medium mt-3">Your cart is empty</div>
        <Link href="/products" className="btn btn-primary mt-5">
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-6 mt-5">
      <div className="intro-y col-span-12 lg:col-span-8">
        <div className="box">
          <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 className="font-medium text-base mr-auto">Items ({cart.totalQuantity})</h2>
            <button type="button" className="btn btn-outline-danger btn-sm" disabled={clear.isPending} onClick={() => clear.mutate(undefined, { onSuccess: () => toast.success("Cart cleared") })}>
              Clear cart
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-report -mt-2">
              <thead>
                <tr>
                  <th className="whitespace-nowrap" />
                  <th className="whitespace-nowrap">PRODUCT</th>
                  <th className="text-center whitespace-nowrap">QUANTITY</th>
                  <th className="text-right whitespace-nowrap">TOTAL</th>
                  <th className="whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {cart.items.map((item) => (
                  <CartRow key={item.productId} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="intro-y col-span-12 lg:col-span-4">
        <div className="box p-5">
          <div className="flex">
            <div className="mr-auto">Subtotal</div>
            <div className="font-medium">{formatPrice(cart.subtotal, cart.currency)}</div>
          </div>
          <div className="flex mt-4 pt-4 border-t border-slate-200/60 dark:border-darkmode-400">
            <div className="mr-auto font-medium text-base">Total Charge</div>
            <div className="font-medium text-base text-primary">{formatPrice(cart.subtotal, cart.currency)}</div>
          </div>
          <div className="text-slate-500 text-xs mt-3">Shipping and taxes are confirmed on the payment page.</div>
          <Link href="/checkout" className="btn btn-primary w-full mt-5">
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CartView() {
  return (
    <RequireAuth>
      <h2 className="intro-y text-lg font-medium mt-10">Shopping Cart</h2>
      <CartContent />
    </RequireAuth>
  );
}
