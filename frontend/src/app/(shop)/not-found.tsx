import { ErrorView } from "@/components/ui/ErrorView";

export default function ShopNotFound() {
  return (
    <ErrorView
      code="404"
      title="Oops. This page has gone missing."
      message="You may have mistyped the address or the page may have moved."
    />
  );
}
