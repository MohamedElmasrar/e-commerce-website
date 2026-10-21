import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/Toast";
import { ProductForm } from "./ProductForm";

const { addImage, create, replace } = vi.hoisted(() => ({
  addImage: vi.fn(),
  create: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/hooks/useAdminProducts", () => ({
  useAdminProduct: () => ({}),
  useCreateProduct: () => ({ mutateAsync: create }),
  useUpdateProduct: () => ({ isPending: false }),
}));
vi.mock("@/hooks/useCategories", () => ({
  useCategories: () => ({ data: [{ id: 1, name: "Pantry" }] }),
}));
vi.mock("@/lib/api/admin", () => ({ adminApi: { products: { addImage } } }));

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllGlobals();
});

function fillProductForm() {
  render(<ToastProvider><ProductForm productId={null} /></ToastProvider>);
  fireEvent.change(screen.getByLabelText("Product Name"), { target: { value: "Olive oil" } });
  fireEvent.change(screen.getByLabelText("SKU"), { target: { value: "OIL-1" } });
  fireEvent.change(screen.getByLabelText("Category"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Price"), { target: { value: "9.50" } });
}

describe("product creation feedback", () => {
  it("confirms a saved product and opens its detail page", async () => {
    create.mockResolvedValue({ id: 7, name: "Olive oil" });
    fillProductForm();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Product created")).toBeTruthy();
    expect(screen.getByText("Olive oil")).toBeTruthy();
    expect(replace).toHaveBeenCalledWith("/admin/products/7");
  });

  it("keeps saving disabled until images finish and explains a partial upload", async () => {
    const createObjectURL = vi.fn().mockReturnValueOnce("blob:first").mockReturnValueOnce("blob:second");
    vi.stubGlobal("URL", Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL: vi.fn() }));
    create.mockResolvedValue({ id: 7, name: "Olive oil" });
    let rejectUpload!: (error: Error) => void;
    addImage.mockResolvedValueOnce({}).mockReturnValueOnce(new Promise((_resolve, reject) => {
      rejectUpload = reject;
    }));
    fillProductForm();
    fireEvent.change(screen.getByLabelText("Choose product images"), {
      target: { files: [new File(["first"], "first.webp", { type: "image/webp" }), new File(["second"], "second.webp", { type: "image/webp" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(addImage).toHaveBeenCalledTimes(2));
    expect((screen.getByRole("button", { name: "Uploading images..." }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Product created")).toBeNull();

    rejectUpload(new Error("Upload failed"));
    expect(await screen.findByText(/1 of 2 images uploaded/)).toBeTruthy();
    expect(replace).toHaveBeenCalledWith("/admin/products/7");
  });
});
