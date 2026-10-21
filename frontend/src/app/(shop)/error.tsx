"use client";

import { ErrorView } from "@/components/ui/ErrorView";

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorView
      code="500"
      title="Something went wrong."
      message="An unexpected error occurred while loading this page."
      action={
        <button type="button" className="intro-x btn btn-primary py-3 px-4 mt-10" onClick={reset}>
          Try again
        </button>
      }
    />
  );
}
