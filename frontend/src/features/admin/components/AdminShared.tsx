import type { ReactNode } from "react";

export function LoadingBox({ height = "h-48" }: { height?: string }) {
  return <div className={`intro-y box mt-5 p-5 animate-pulse ${height}`} aria-busy="true" />;
}

export function LoadError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert alert-danger mt-5" role="alert">
      {message}{" "}
      {onRetry ? (
        <button type="button" className="underline" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="intro-y flex flex-col sm:flex-row items-center mt-8">
      <h2 className="text-lg font-medium mr-auto">{title}</h2>
      {children ? <div className="w-full sm:w-auto flex mt-4 sm:mt-0">{children}</div> : null}
    </div>
  );
}
