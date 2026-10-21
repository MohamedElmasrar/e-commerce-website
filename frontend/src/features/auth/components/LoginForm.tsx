"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useAuth";
import { readFormError } from "@/features/shared/form-errors";
import { safeRedirect, validateLogin, type FieldErrors } from "../validation";

type Field = "email" | "password";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const next = safeRedirect(useSearchParams().get("next"));
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [general, setGeneral] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const clientErrors = validateLogin(values);
    setErrors(clientErrors);
    setGeneral(undefined);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      router.push(next);
    } catch (error) {
      const parsed = readFormError(error, ["email", "password"] as const);
      setErrors(parsed.fields);
      setGeneral(parsed.general);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="intro-x font-bold text-2xl xl:text-3xl text-center xl:text-left">Sign In</h2>
      <div className="intro-x mt-2 text-slate-400 xl:hidden text-center">
        A few more clicks to sign in to your account. Manage all your e-commerce accounts in one place
      </div>
      {general ? (
        <div className="intro-x alert alert-danger mt-5" role="alert">
          {general}
        </div>
      ) : null}
      <div className="intro-x mt-8">
        <input
          type="email"
          autoComplete="email"
          aria-label="Email"
          aria-invalid={Boolean(errors.email)}
          className="intro-x login__input form-control py-3 px-4 block"
          placeholder="Email"
          value={values.email}
          onChange={(event) => setValues({ ...values, email: event.target.value })}
        />
        {errors.email ? <div className="text-danger mt-2 text-xs">{errors.email}</div> : null}
        <input
          type="password"
          autoComplete="current-password"
          aria-label="Password"
          aria-invalid={Boolean(errors.password)}
          className="intro-x login__input form-control py-3 px-4 block mt-4"
          placeholder="Password"
          value={values.password}
          onChange={(event) => setValues({ ...values, password: event.target.value })}
        />
        {errors.password ? <div className="text-danger mt-2 text-xs">{errors.password}</div> : null}
      </div>
      <div className="intro-x mt-5 xl:mt-8 text-center xl:text-left">
        <button type="submit" disabled={submitting} className="btn btn-primary py-3 px-4 w-full xl:w-32 xl:mr-3 align-top">
          {submitting ? "Signing in..." : "Login"}
        </button>
        <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="btn btn-outline-secondary py-3 px-4 w-full xl:w-32 mt-3 xl:mt-0 align-top">
          Register
        </Link>
      </div>
    </form>
  );
}
