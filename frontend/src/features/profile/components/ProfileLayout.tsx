"use client";

import { Lock, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";

const LINKS = [
  { href: "/profile", label: "Personal Information", icon: User },
  { href: "/profile/password", label: "Change Password", icon: Lock },
];

/** Profile pages frame: side box with account links and the form box next to it (update-profile.html). */
export function ProfileLayout({ title, children }: { title: string; children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const initial = user?.fullName.trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <div className="intro-y flex items-center mt-8">
        <h2 className="text-lg font-medium mr-auto">{title}</h2>
      </div>
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3 flex lg:block flex-col-reverse">
          <div className="intro-y box mt-5">
            <div className="relative flex items-center p-5">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-medium text-lg">{initial}</div>
              <div className="ml-4 mr-auto">
                <div className="font-medium text-base">{user?.fullName}</div>
                <div className="text-slate-500">{user?.email}</div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-200/60 dark:border-darkmode-400">
              {LINKS.map(({ href, label, icon: Icon }, index) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center${index > 0 ? " mt-5" : ""}${pathname === href ? " text-primary font-medium" : ""}`}
                >
                  <Icon className="w-4 h-4 mr-2" /> {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-8 2xl:col-span-9">{children}</div>
      </div>
    </>
  );
}
