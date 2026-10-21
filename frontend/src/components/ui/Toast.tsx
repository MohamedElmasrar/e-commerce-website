"use client";

import { CheckCircle, TriangleAlert, X, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type ToastKind = "success" | "warning" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastApi {
  success: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_ICONS = {
  success: { Icon: CheckCircle, color: "text-success" },
  warning: { Icon: TriangleAlert, color: "text-pending" },
  error: { Icon: XCircle, color: "text-danger" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = nextId.current++;
    setToasts((list) => [...list, { id, kind, title, message }]);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (title, message) => push("success", title, message),
      warning: (title, message) => push("warning", title, message),
      error: (title, message) => push("error", title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="app-toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} dismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastView({ toast, dismiss }: { toast: ToastItem; dismiss: (id: number) => void }) {
  const { id, kind } = toast;
  const { Icon, color } = TOAST_ICONS[kind];
  useEffect(() => {
    const timer = setTimeout(() => dismiss(id), kind === "success" ? 5000 : 8000);
    return () => clearTimeout(timer);
  }, [id, kind, dismiss]);

  return (
    <div className="app-toast toastify-content">
      <Icon className={color} aria-hidden="true" />
      <div className="app-toast__text">
        <div className="font-medium">{toast.title}</div>
        {toast.message ? <div className="text-slate-500 mt-1">{toast.message}</div> : null}
      </div>
      <button className="app-toast__close" type="button" aria-label="Dismiss notification" onClick={() => dismiss(id)}>
        <X size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
