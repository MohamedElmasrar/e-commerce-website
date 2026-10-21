import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { PasswordForm } from "@/features/profile/components/PasswordForm";
import { ProfileLayout } from "@/features/profile/components/ProfileLayout";

export const metadata: Metadata = { title: "Change Password" };

export default function ChangePasswordPage() {
  return (
    <RequireAuth>
      <ProfileLayout title="Change Password">
        <PasswordForm />
      </ProfileLayout>
    </RequireAuth>
  );
}
