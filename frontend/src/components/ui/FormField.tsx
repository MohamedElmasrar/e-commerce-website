import type { ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  help?: string;
  children: ReactNode;
}

/** Label + control + validation message, using template form classes. */
export function FormField({ id, label, error, help, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      {children}
      {error ? (
        <div id={`${id}-error`} className="text-danger text-xs mt-2" role="alert">
          {error}
        </div>
      ) : help ? (
        <div className="form-help">{help}</div>
      ) : null}
    </div>
  );
}
