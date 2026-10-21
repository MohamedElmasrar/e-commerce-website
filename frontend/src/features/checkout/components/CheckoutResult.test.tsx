import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import { POLL_LIMIT_MS } from "../polling";
import { CheckoutSuccess } from "./CheckoutResult";

const { useOrder } = vi.hoisted(() => ({ useOrder: vi.fn() }));
vi.mock("@/hooks/useOrders", () => ({ useOrder }));
vi.mock("@/features/auth/components/RequireAuth", () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/features/orders/components/OrderSummary", () => ({ OrderSummary: () => null }));

function checkout() {
  return <ToastProvider><CheckoutSuccess orderId={42} /></ToastProvider>;
}

afterEach(() => vi.useRealTimers());

describe("checkout feedback", () => {
  it("shows a single dismissible success notification when payment clears", () => {
    useOrder.mockReturnValue({ data: { id: 42, status: "PENDING_PAYMENT" } });
    const { rerender } = render(checkout());
    expect(screen.queryByRole("button", { name: "Dismiss notification" })).toBeNull();

    useOrder.mockReturnValue({ data: { id: 42, status: "PAID" } });
    rerender(checkout());
    expect(screen.getByText("Order #42 is confirmed.")).toBeTruthy();

    useOrder.mockReturnValue({ data: { id: 42, status: "PROCESSING" } });
    rerender(checkout());
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Order #42 is confirmed.")).toBeNull();
    expect(screen.getByText("Thank you. Order #42 is confirmed.")).toBeTruthy();
  });

  it.each([
    ["CANCELLED", "Order cancelled"],
    ["REFUNDED", "Payment refunded"],
  ])("shows the current status for %s orders", (status, title) => {
    useOrder.mockReturnValue({ data: { id: 42, status } });
    render(checkout());
    expect(screen.getByText(title)).toBeTruthy();
    expect(screen.queryByText("Payment received")).toBeNull();
  });

  it("offers a manual status check when automatic confirmation times out", () => {
    vi.useFakeTimers();
    const refetch = vi.fn();
    useOrder.mockReturnValue({ data: { id: 42, status: "PENDING_PAYMENT" }, refetch });
    render(checkout());
    act(() => vi.advanceTimersByTime(POLL_LIMIT_MS));

    expect(screen.getByText("Payment confirmation is taking longer than expected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Check status" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
