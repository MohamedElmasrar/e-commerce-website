export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) return "Email is required";
  if (email.length > 255 || !EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address";
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 72) return "Password must be at most 72 characters";
  return undefined;
}

export function validateFullName(fullName: string): string | undefined {
  if (!fullName.trim()) return "Full name is required";
  if (fullName.trim().length > 150) return "Full name must be at most 150 characters";
  return undefined;
}

export function validateLogin(values: { email: string; password: string }): FieldErrors<"email" | "password"> {
  const errors: FieldErrors<"email" | "password"> = {};
  const email = validateEmail(values.email);
  if (email) errors.email = email;
  if (!values.password) errors.password = "Password is required";
  return errors;
}

export function validateRegister(values: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): FieldErrors<"fullName" | "email" | "password" | "confirmPassword"> {
  const errors: FieldErrors<"fullName" | "email" | "password" | "confirmPassword"> = {};
  const fullName = validateFullName(values.fullName);
  const email = validateEmail(values.email);
  const password = validateNewPassword(values.password);
  if (fullName) errors.fullName = fullName;
  if (email) errors.email = email;
  if (password) errors.password = password;
  else if (values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match";
  return errors;
}

export function validateChangePassword(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): FieldErrors<"currentPassword" | "newPassword" | "confirmPassword"> {
  const errors: FieldErrors<"currentPassword" | "newPassword" | "confirmPassword"> = {};
  if (!values.currentPassword) errors.currentPassword = "Current password is required";
  const newPassword = validateNewPassword(values.newPassword);
  if (newPassword) errors.newPassword = newPassword;
  else if (values.newPassword === values.currentPassword) errors.newPassword = "New password must be different";
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = "Passwords do not match";
  return errors;
}

/** Only allow same-site relative redirects after login. */
export function safeRedirect(target: string | null | undefined, fallback = "/"): string {
  if (!target || !target.startsWith("/") || target.startsWith("//") || target.startsWith("/\\")) return fallback;
  return target;
}
