/** Placeholder blocks built from template classes (`box`, `animate-pulse`, slate backgrounds). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-md ${className}`.trim()} aria-hidden="true" />;
}

export function ProductCardSkeleton() {
  return (
    <div className="intro-y col-span-12 md:col-span-6 lg:col-span-4 xl:col-span-3">
      <div className="box">
        <div className="p-5">
          <Skeleton className="h-40 2xl:h-56" />
          <Skeleton className="h-4 w-3/4 mt-5" />
          <Skeleton className="h-4 w-1/2 mt-3" />
        </div>
        <div className="p-5 border-t border-slate-200/60">
          <Skeleton className="h-6 w-24 ml-auto" />
        </div>
      </div>
    </div>
  );
}
