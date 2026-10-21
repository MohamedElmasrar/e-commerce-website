"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { readFormError } from "@/features/shared/form-errors";
import { useCart } from "@/hooks/useCart";
import { usePlaceOrder } from "@/hooks/useCheckout";
import type { ShippingAddress } from "@/lib/api/types";
import { formatPrice } from "@/lib/utils/format";
import { CheckoutSessionError } from "../checkout-flow";
import { checkoutCountries } from "../countries";
import { ADDRESS_FIELDS, emptyAddress, normalizeAddress, validateAddress, type AddressErrors, type AddressField } from "../validation";

const FIELD_LABELS: Record<AddressField, string> = {
  name: "Full name",
  line1: "Address line 1",
  line2: "Address line 2 (optional)",
  city: "City",
  state: "State / region (optional)",
  postalCode: "Postal code",
  country: "Country",
};

const FIELD_AUTOCOMPLETE: Record<AddressField, string> = {
  name: "shipping name",
  line1: "shipping address-line1",
  line2: "shipping address-line2",
  city: "shipping address-level2",
  state: "shipping address-level1",
  postalCode: "shipping postal-code",
  country: "shipping country",
};

const LAYOUT: AddressField[][] = [["name"], ["line1"], ["line2"], ["city", "state"], ["postalCode", "country"]];

function CheckoutContent() {
  const { data: cart, isPending, isError, refetch } = useCart();
  const placeOrder = usePlaceOrder();
  const [address, setAddress] = useState<ShippingAddress>(emptyAddress);
  const [errors, setErrors] = useState<AddressErrors>({});
  const [general, setGeneral] = useState<string>();

  if (placeOrder.error instanceof CheckoutSessionError) {
    const { orderId } = placeOrder.error;
    return (
      <div className="intro-y box mt-5 p-5">
        <div className="alert alert-warning" role="alert">
          Order #{orderId} was placed, but the payment page could not open. You can retry payment from your order.
        </div>
        <Link href={`/orders/${orderId}`} className="btn btn-primary mt-4">View order and retry payment</Link>
      </div>
    );
  }

  if (placeOrder.isSuccess || (placeOrder.isPending && !cart?.items.length)) {
    return <div className="intro-y box mt-5 p-5" role="status">Redirecting to payment...</div>;
  }
  if (isPending) return <div className="intro-y box mt-5 p-5 animate-pulse h-48" aria-busy="true" />;
  if (isError && !cart) {
    return (
      <div className="alert alert-danger mt-5" role="alert">
        Your cart could not be loaded.{" "}
        <button type="button" className="underline" onClick={() => refetch()}>Try again</button>
      </div>
    );
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div className="intro-y box mt-5 p-10 text-center">
        <div className="text-lg font-medium">Your cart is empty</div>
        <Link href="/products" className="btn btn-primary mt-5">
          Browse products
        </Link>
      </div>
    );
  }

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (placeOrder.isPending) return;
    const normalized = normalizeAddress(address);
    const found = validateAddress(normalized);
    setErrors(found);
    setGeneral(undefined);
    if (Object.keys(found).length > 0) return;
    placeOrder.mutate(normalized, {
      onError: (failure) => {
        if (failure instanceof CheckoutSessionError) return;
        const parsed = readFormError(failure, ADDRESS_FIELDS.map((f) => `shippingAddress.${f}`));
        const mapped: AddressErrors = {};
        for (const field of ADDRESS_FIELDS) mapped[field] = parsed.fields[`shippingAddress.${field}`];
        setErrors(mapped);
        setGeneral(parsed.general);
      },
    });
  };

  const busy = placeOrder.isPending || placeOrder.isSuccess;

  return (
    <div className="grid grid-cols-12 gap-6 mt-5">
      <form className="checkout-form intro-y col-span-12 lg:col-span-8" onSubmit={submit} noValidate>
        <div className="box">
          <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 className="font-medium text-base mr-auto">Shipping address</h2>
          </div>
          <div className="p-5">
            {general ? (
              <div className="alert alert-danger mb-5" role="alert">
                {general}
              </div>
            ) : null}
            {LAYOUT.map((row) => (
              <div key={row.join("-")} className={`grid grid-cols-12 gap-4 ${row[0] === "name" ? "" : "mt-3"}`}>
                {row.map((field) => {
                  const id = `address-${field}`;
                  const error = errors[field];
                  const controlProps = {
                    id,
                    name: field,
                    value: address[field] ?? "",
                    autoComplete: FIELD_AUTOCOMPLETE[field],
                    "aria-invalid": Boolean(error),
                    "aria-describedby": error ? `${id}-error` : undefined,
                    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                      const value = event.target.value;
                      setAddress((current) => ({ ...current, [field]: value }));
                    },
                  };

                  return (
                    <div key={field} className={row.length === 1 ? "col-span-12" : "col-span-12 sm:col-span-6"}>
                      <FormField id={id} label={FIELD_LABELS[field]} error={error}>
                        {field === "country" ? (
                          <select {...controlProps} className="form-select checkout-control">
                            <option value="" disabled>Select a country</option>
                            {checkoutCountries.map(({ code, name, flag }) => (
                              <option key={code} value={code}>{`${flag} ${name}`}</option>
                            ))}
                          </select>
                        ) : (
                          <input {...controlProps} type="text" className="form-control checkout-control" />
                        )}
                      </FormField>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button type="submit" className="btn btn-primary w-48" disabled={busy}>
            {busy ? "Redirecting to payment..." : "Pay with card"}
          </button>
        </div>
      </form>
      <div className="intro-y col-span-12 lg:col-span-4">
        <div className="box p-5">
          <div className="font-medium text-base mb-3">Order summary</div>
          {cart.items.map((item) => (
            <div key={item.productId} className="flex mt-2">
              <div className="mr-auto">
                {item.name} <span className="text-slate-500">x {item.quantity}</span>
              </div>
              <div>{formatPrice(item.lineTotal, item.currency)}</div>
            </div>
          ))}
          <div className="flex mt-4 pt-4 border-t border-slate-200/60 dark:border-darkmode-400">
            <div className="mr-auto font-medium">Total</div>
            <div className="font-medium text-primary">{formatPrice(cart.subtotal, cart.currency)}</div>
          </div>
          <div className="text-slate-500 text-xs mt-3">The final amount is calculated by the server when the order is placed.</div>
        </div>
      </div>
    </div>
  );
}

export function CheckoutForm() {
  return (
    <RequireAuth>
      <h2 className="intro-y text-lg font-medium mt-10">Checkout</h2>
      <CheckoutContent />
    </RequireAuth>
  );
}
