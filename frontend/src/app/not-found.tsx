import { RootDocument } from "@/components/layout/RootDocument";
import { ErrorView } from "@/components/ui/ErrorView";

/** Fallback for URLs that match no route group. It supplies its own document because there is no shared root layout. */
export default function GlobalNotFound() {
  return (
    <RootDocument bodyClass="main">
      <div className="container">
        <ErrorView
          fullPage
          code="404"
          title="Oops. This page has gone missing."
          message="You may have mistyped the address or the page may have moved."
        />
      </div>
    </RootDocument>
  );
}
