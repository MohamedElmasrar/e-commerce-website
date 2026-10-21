"use client";

import { XCircle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
}

/** Markup taken from the template "delete confirmation" modal. */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title = "Are you sure?",
  message = "This process cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} label={title}>
      <div className="modal-body p-0">
        <div className="p-5 text-center">
          <XCircle className="w-16 h-16 text-danger mx-auto mt-3" />
          <div className="text-3xl mt-5">{title}</div>
          <div className="text-slate-500 mt-2">{message}</div>
        </div>
        <div className="px-5 pb-8 text-center">
          <button type="button" className="btn btn-outline-secondary w-24 mr-1" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn-danger w-24" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
