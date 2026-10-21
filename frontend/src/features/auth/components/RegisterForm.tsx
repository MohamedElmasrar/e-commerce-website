"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { readFormError } from "@/features/shared/form-errors";
import { safeRedirect, validateRegister, type FieldErrors } from "../validation";

type Field = "fullName" | "email" | "password" | "confirmPassword";

export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get("next"));
  const [values, setValues] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [general, setGeneral] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const update = (field: Field, value: string) => setValues((current) => ({ ...current, [field]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clientErrors = validateRegister(values);
    setErrors(clientErrors);
    setGeneral(undefined);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await register({ fullName: values.fullName.trim(), email: values.email.trim(), password: values.password });
      router.push(next);
    } catch (error) {
      const parsed = readFormError(error, ["fullName", "email", "password"] as const);
      setErrors(parsed.fields);
      setGeneral(parsed.general);
    } finally {
      setSubmitting(false);
    }
  };

  const input = (field: Field, placeholder: string, type: string, autoComplete: string, extra = "") => (
    <>
      <input
        type={type}
        autoComplete={autoComplete}
        aria-label={placeholder}
        aria-invalid={Boolean(errors[field])}
        className={`intro-x login__input form-control py-3 px-4 block ${extra}`.trim()}
        placeholder={placeholder}
        value={values[field]}
        onChange={(event) => update(field, event.target.value)}
      />
      {errors[field] ? <div className="text-danger mt-2 text-xs">{errors[field]}</div> : null}
    </>
  );

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left">Sign Up</h2>
      <div className="intro-x mt-2 text-slate-400 xl:hidden text-center">
        A few more clicks to sign up to your account. Manage all your e-commerce accounts in one place
      </div>
      {general ? (
        <div className="intro-x alert alert-danger mt-5" role="alert">
          {general}
        </div>
      ) : null}
      <div className="intro-x mt-8">
        {input("fullName", "Full Name", "text", "name")}
        {input("email", "Email", "email", "email", "mt-4")}
        {input("password", "Password", "password", "new-password", "mt-4")}
        {input("confirmPassword", "Password Confirmation", "password", "new-password", "mt-4")}
      </div>
      <div className="intro-x mt-5 xl:mt-8 text-center xl:text-left">
        <button type="submit" disabled={submitting} className="btn btn-primary py-3 px-4 w-full xl:w-32 xl:mr-3 align-top">
          {submitting ? "Registering..." : "Register"}
        </button>
        <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="btn btn-outline-secondary py-3 px-4 w-full xl:w-32 mt-3 xl:mt-0 align-top">
          Sign in
        </Link>
      </div>
    </form>
  );
}
