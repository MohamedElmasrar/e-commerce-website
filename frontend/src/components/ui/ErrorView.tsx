import Link from "next/link";
import type { ReactNode } from "react";

interface ErrorViewProps {
  code: string;
  title: string;
  message: string;
  /** Full page uses the white-on-blue template page; inline suits the light content area. */
  fullPage?: boolean;
  action?: ReactNode;
}

/** Markup from main-light-error-page.html. */
export function ErrorView({ code, title, message, fullPage = false, action }: ErrorViewProps) {
  const text = fullPage ? "text-white" : "";
  return (
    <div
      className={`error-page flex flex-col lg:flex-row items-center justify-center ${fullPage ? "h-screen" : "py-10"} text-center lg:text-left`}
    >
      <div className="-intro-x lg:mr-20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="h-48 lg:h-auto" src="/dist/images/error-illustration.svg" />
      </div>
      <div className={`${text} mt-10 lg:mt-0`}>
        <div className="intro-x text-8xl font-medium">{code}</div>
        <div className="intro-x text-xl lg:text-3xl font-medium mt-5">{title}</div>
        <div className="intro-x text-lg mt-3">{message}</div>
        {action ?? (
          <Link
            href="/"
            className={`intro-x btn py-3 px-4 mt-10 ${fullPage ? "text-white border-white dark:border-darkmode-400 dark:text-slate-200" : ""}`}
          >
            Back to Home
          </Link>
        )}
      </div>
    </div>
  );
}
