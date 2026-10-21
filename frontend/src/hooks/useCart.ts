"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { previewAdd, previewClear, previewRemove, previewSetQuantity } from "@/features/cart/optimistic";
import { cartApi } from "@/lib/api/cart";
import type { CartResponse } from "@/lib/api/types";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "./useAuth";

export function useCart() {
  const { status } = useAuth();
  return useQuery({
    queryKey: queryKeys.cart.all,
    queryFn: cartApi.get,
    enabled: status === "authenticated",
  });
}

interface OptimisticContext {
  previous: CartResponse | undefined;
}

/**
 * Cart mutation with an optimistic update: the cached cart is previewed immediately (onMutate),
 * restored if the request fails (onError) and replaced by the server state afterwards (onSettled).
 */
function useOptimisticCartMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<CartResponse>,
  preview: (cart: CartResponse, variables: TVariables) => CartResponse,
) {
  const queryClient = useQueryClient();
  return useMutation<CartResponse, Error, TVariables, OptimisticContext>({
    mutationFn,
    onMutate: async (variables) => {
      // A running refetch would overwrite the preview when it resolves.
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.all });
      const previous = queryClient.getQueryData<CartResponse>(queryKeys.cart.all);
      if (previous) queryClient.setQueryData(queryKeys.cart.all, preview(previous, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cart.all, context.previous);
    },
    onSuccess: (cart) => queryClient.setQueryData(queryKeys.cart.all, cart),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.cart.all }),
  });
}

export function useAddToCart() {
  return useOptimisticCartMutation(
    ({ productId, quantity }: { productId: number; quantity: number }) => cartApi.addItem(productId, quantity),
    (cart, { productId, quantity }) => previewAdd(cart, productId, quantity),
  );
}

export function useUpdateCartItem() {
  return useOptimisticCartMutation(
    ({ productId, quantity }: { productId: number; quantity: number }) => cartApi.setQuantity(productId, quantity),
    (cart, { productId, quantity }) => previewSetQuantity(cart, productId, quantity),
  );
}

export function useRemoveCartItem() {
  return useOptimisticCartMutation(
    (productId: number) => cartApi.removeItem(productId),
    (cart, productId) => previewRemove(cart, productId),
  );
}

export function useClearCart() {
  return useOptimisticCartMutation(
    () => cartApi.clear(),
    (cart) => previewClear(cart),
  );
}
