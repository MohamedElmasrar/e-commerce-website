import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Icewall Shop" className="w-6" src="/dist/images/logo.svg" />
      <span className="text-white text-lg ml-3"> Icewall </span>
    </Link>
  );
}
