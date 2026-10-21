import type { ReactNode } from "react";
import { MobileMenu } from "./MobileMenu";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

/** Page frame copied from the template: mobile menu, boxed top bar, side nav and content area. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <MobileMenu />
      <TopBar />
      <div className="wrapper">
        <div className="wrapper-box">
          <SideNav />
          <div className="content">{children}</div>
        </div>
      </div>
    </>
  );
}
