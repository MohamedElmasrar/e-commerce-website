import type { Metadata } from "next";
import { RequireAuth } from "@/features/auth/components/RequireAuth";
import { ProfileForm } from "@/features/profile/components/ProfileForm";
import { ProfileLayout } from "@/features/profile/components/ProfileLayout";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileLayout title="Update Profile">
        <ProfileForm />
      </ProfileLayout>
    </RequireAuth>
  );
}
