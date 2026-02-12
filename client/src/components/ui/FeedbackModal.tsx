"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type FeedbackModalProps = {
  open: boolean;
  type: "success" | "error";
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
};

export default function FeedbackModal({
  open,
  type,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
}: FeedbackModalProps) {
  const [visible, setVisible] = useState(open);

  useEffect(() => {
    if (open) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [open]);

  if (!visible && !open) {
    return null;
  }

  const isConfirm = Boolean(onConfirm);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 transition-opacity duration-200",
        open ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={cn(
                "text-sm font-semibold",
                type === "success" ? "text-emerald-300" : "text-rose-300",
              )}
            >
              {title}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted/50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex justify-end">
          {isConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted/50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  type === "success"
                    ? "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                    : "bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
                )}
              >
                {confirmLabel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition",
                type === "success"
                  ? "bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                  : "bg-rose-500/10 text-rose-200 hover:bg-rose-500/20",
              )}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
