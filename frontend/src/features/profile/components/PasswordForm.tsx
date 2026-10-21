"use client";

import { useState, type FormEvent } from "react";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { validateChangePassword, type FieldErrors } from "@/features/auth/validation";
import { readFormError } from "@/features/shared/form-errors";
import { useChangePassword } from "@/hooks/useProfile";

type Field = "currentPassword" | "newPassword" | "confirmPassword";
const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function PasswordForm() {
  const change = useChangePassword();
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [general, setGeneral] = useState<string>();

  const field = (name: Field, label: string, autoComplete: string) => (
    <div className={name === "currentPassword" ? "" : "mt-3"}>
      <FormField id={`password-${name}`} label={label} error={errors[name]}>
        <input
          id={`password-${name}`}
          type="password"
          autoComplete={autoComplete}
          className="form-control"
          value={values[name]}
          onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
        />
      </FormField>
    </div>
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const clientErrors = validateChangePassword(values);
    setErrors(clientErrors);
    setGeneral(undefined);
    if (Object.keys(clientErrors).length > 0) return;
    change.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setValues(EMPTY);
          toast.success("Password changed");
        },
        onError: (failure) => {
          const parsed = readFormError(failure, ["currentPassword", "newPassword"] as const);
          setErrors(parsed.fields);
          setGeneral(parsed.general);
        },
      },
    );
  };

  return (
    <form className="intro-y box lg:mt-5" onSubmit={submit} noValidate>
      <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
        <h2 className="font-medium text-base mr-auto">Change Password</h2>
      </div>
      <div className="p-5">
        {general ? (
          <div className="alert alert-danger mb-5" role="alert">
            {general}
          </div>
        ) : null}
        {field("currentPassword", "Current Password", "current-password")}
        {field("newPassword", "New Password", "new-password")}
        {field("confirmPassword", "Confirm New Password", "new-password")}
        <button type="submit" className="btn btn-primary mt-4" disabled={change.isPending}>
          {change.isPending ? "Saving..." : "Change Password"}
        </button>
      </div>
    </form>
  );
}
