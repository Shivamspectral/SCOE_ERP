import React from "react";
import { CheckCircle2, Info, TriangleAlert, CircleX, X } from "lucide-react";
import { usePortal } from "../context/PortalContext";

export function Toaster() {
  const { toasts, dismissToast } = usePortal();

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle2 className="size-5 text-success shrink-0" />,
    info: <Info className="size-5 text-chart-5 shrink-0" />,
    warning: <TriangleAlert className="size-5 text-warning shrink-0" />,
    destructive: <CircleX className="size-5 text-destructive shrink-0" />,
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto animate-fade-in-up flex items-start gap-3 rounded-xl border border-border bg-popover p-4 shadow-xl text-popover-foreground transition-all"
        >
          {icons[toast.variant] || icons.success}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-foreground">{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
            aria-label="Close notification"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
