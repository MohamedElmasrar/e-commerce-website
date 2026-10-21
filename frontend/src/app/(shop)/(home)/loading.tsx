import { ProductCardSkeleton } from "@/components/ui/Skeleton";

export default function ProductsLoading() {
  return (
    <>
      <h2 className="intro-y text-lg font-medium mt-10">Products</h2>
      <div className="grid grid-cols-12 gap-6 mt-5" aria-busy="true">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
