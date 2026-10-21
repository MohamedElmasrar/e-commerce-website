import type { ReactNode } from "react";
import Link from "next/link";

/** Two column login layout from login-light-login.html. */
export function AuthShell({ headline, children }: { headline: ReactNode; children: ReactNode }) {
  return (
    <div className="container sm:px-10">
      <div className="block xl:grid grid-cols-2 gap-4">
        <div className="hidden xl:flex flex-col min-h-screen">
          <Link href="/" className="-intro-x flex items-center pt-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Icewall Shop" className="w-6" src="/dist/images/logo.svg" />
            <span className="text-white text-lg ml-3"> Icewall </span>
          </Link>
          <div className="my-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" className="-intro-x w-1/2 -mt-16" src="/dist/images/illustration.svg" />
            <div className="-intro-x text-white font-medium text-4xl leading-tight mt-10">{headline}</div>
            <div className="-intro-x mt-5 text-lg text-white text-opacity-70 dark:text-slate-400">
              Manage all your e-commerce accounts in one place
            </div>
          </div>
        </div>
        <div className="h-screen xl:h-auto flex py-5 xl:py-0 my-10 xl:my-0">
          <div className="my-auto mx-auto xl:ml-20 bg-white dark:bg-darkmode-600 xl:bg-transparent px-5 sm:px-8 py-8 xl:p-0 rounded-md shadow-md xl:shadow-none w-full sm:w-3/4 lg:w-2/4 xl:w-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
