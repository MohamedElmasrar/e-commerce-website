import type { Metadata } from "next";
import { Dashboard } from "@/features/admin/dashboard/Dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage() {
  return <Dashboard />;
}
