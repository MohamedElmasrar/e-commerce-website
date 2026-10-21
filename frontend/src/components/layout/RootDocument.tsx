import type { ReactNode } from "react";
import "@/styles/extras.css";

/**
 * Shared <html>/<body> for the root layouts. The template styles `body.main` (app pages)
 * and `body.login` (auth pages), so each route group supplies its own body class.
 * The precompiled template stylesheet is served from public/dist; dist/js/app.js is never loaded.
 */
export function RootDocument({ bodyClass, children }: { bodyClass: "main" | "login"; children: ReactNode }) {
  return (
    <html lang="en" className="light">
      {/* eslint-disable-next-line @next/next/no-head-element */}
      <head>
        <link rel="shortcut icon" href="/dist/images/logo.svg" />
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/dist/css/app.css" />
      </head>
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
