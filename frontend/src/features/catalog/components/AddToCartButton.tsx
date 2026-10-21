"use client";

import { ShoppingCart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCart } from "@/hooks/useCart";

interface AddToCartButtonProps {
  productId: number;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

/** Adds to the cart, or sends anonymous visitors to the login page and back. */
export function AddToCartButton({
  productId,
  quantity = 1,
  disabled,
  className = "btn btn-primary",
  label = "Add to cart",
}: AddToCartButtonProps) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const addToCart = useAddToCart();

  const onClick = () => {
    if (status !== "authenticated") {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    addToCart.mutate(
      { productId, quantity },
      {
        onSuccess: () => toast.success("Added to cart"),
      },
    );
  };

  return (
    <button type="button" className={className} disabled={disabled || addToCart.isPending} onClick={onClick}>
      <ShoppingCart className="w-4 h-4 mr-2" /> {label}
    </button>
  );
}
