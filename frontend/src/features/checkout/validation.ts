import type { ShippingAddress } from "@/lib/api/types";

export type AddressField = "name" | "line1" | "line2" | "city" | "state" | "postalCode" | "country";
export const ADDRESS_FIELDS: readonly AddressField[] = ["name", "line1", "line2", "city", "state", "postalCode", "country"];

export type AddressErrors = Partial<Record<AddressField, string>>;

export const emptyAddress: ShippingAddress = {
  name: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
};

const MAX: Record<AddressField, number> = { name: 150, line1: 255, line2: 255, city: 120, state: 120, postalCode: 20, country: 2 };

export function validateAddress(address: ShippingAddress): AddressErrors {
  const errors: AddressErrors = {};
  const required: [AddressField, string][] = [
    ["name", "Full name"],
    ["line1", "Address"],
    ["city", "City"],
    ["postalCode", "Postal code"],
    ["country", "Country"],
  ];
  for (const [field, label] of required) {
    const value = (address[field] ?? "").trim();
    if (!value) errors[field] = `${label} is required`;
    else if (field !== "country" && value.length > MAX[field]) errors[field] = `${label} must be at most ${MAX[field]} characters`;
  }
  for (const field of ["line2", "state"] as const) {
    if ((address[field] ?? "").length > MAX[field]) errors[field] = `Must be at most ${MAX[field]} characters`;
  }
  if (!errors.country && !/^[A-Za-z]{2}$/.test(address.country.trim())) {
    errors.country = "Use the 2-letter country code, for example US";
  }
  return errors;
}

/** Trims every value and drops empty optional fields before the address is sent. */
export function normalizeAddress(address: ShippingAddress): ShippingAddress {
  return {
    name: address.name.trim(),
    line1: address.line1.trim(),
    line2: address.line2?.trim() || null,
    city: address.city.trim(),
    state: address.state?.trim() || null,
    postalCode: address.postalCode.trim(),
    country: address.country.trim().toUpperCase(),
  };
}
