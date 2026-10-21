"use client";

import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { readFormError } from "@/features/shared/form-errors";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { validateFullName } from "@/features/auth/validation";

export function ProfileForm() {
  const { data: profile, isPending } = useProfile();
  const update = useUpdateProfile();
  const toast = useToast();
  const [edited, setEdited] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [general, setGeneral] = useState<string>();

  if (isPending || !profile) return <div className="intro-y box lg:mt-5 p-5 animate-pulse h-48" aria-busy="true" />;

  const fullName = edited ?? profile.fullName;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const validation = validateFullName(fullName);
    setError(validation);
    setGeneral(undefined);
    if (validation) return;
    update.mutate(
      { fullName: fullName.trim() },
      {
        onSuccess: () => {
          setEdited(null);
          toast.success("Profile updated");
        },
        onError: (failure) => {
          const parsed = readFormError(failure, ["fullName"] as const);
          setError(parsed.fields.fullName);
          setGeneral(parsed.general);
        },
      },
    );
  };

  return (
    <form className="intro-y box lg:mt-5" onSubmit={submit} noValidate>
      <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
        <h2 className="font-medium text-base mr-auto">Personal Information</h2>
      </div>
      <div className="p-5">
        {general ? (
          <div className="alert alert-danger mb-5" role="alert">
            {general}
          </div>
        ) : null}
        <FormField id="profile-full-name" label="Full Name" error={error}>
          <input
            id="profile-full-name"
            type="text"
            className="form-control"
            value={fullName}
            onChange={(event) => setEdited(event.target.value)}
          />
        </FormField>
        <div className="mt-3">
          <FormField id="profile-email" label="Email" help="Your email address cannot be changed.">
            <input id="profile-email" type="email" className="form-control" value={profile.email} disabled readOnly />
          </FormField>
        </div>
        <div className="mt-3">
          <FormField id="profile-role" label="Role">
            <input id="profile-role" type="text" className="form-control" value={profile.role} disabled readOnly />
          </FormField>
        </div>
        <div className="flex justify-end mt-4">
          <button type="submit" className="btn btn-primary w-20" disabled={update.isPending}>
            {update.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </form>
  );
}
