import { Skeleton } from "@/components/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <>
      <h2 className="intro-y text-lg font-medium mt-10">Categories</h2>
      <div className="intro-y box mt-5 p-5" aria-busy="true">
        <Skeleton className="h-40" />
      </div>
    </>
  );
}
