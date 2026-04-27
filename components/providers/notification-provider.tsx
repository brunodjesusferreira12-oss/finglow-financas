"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type NotificationVariant = "success" | "error" | "info";

type Toast = {
  id: string;
  title?: string;
  message: string;
  variant: NotificationVariant;
};

type NotificationContextValue = {
  notify: (toast: Omit<Toast, "id">) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();

      setToasts((current) => [...current, { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto overflow-hidden rounded-3xl border p-4 shadow-panel backdrop-blur",
              toast.variant === "success" && "border-success/25 bg-success/10 text-success-foreground dark:text-foreground",
              toast.variant === "error" && "border-danger/25 bg-danger/10 text-danger-foreground dark:text-foreground",
              toast.variant === "info" && "border-border bg-card/95 text-card-foreground",
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {toast.variant === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <CircleAlert className={cn("h-5 w-5", toast.variant === "error" ? "text-danger" : "text-accent")} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
                <p className="text-sm text-muted-foreground">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications precisa ser usado dentro de NotificationProvider.");
  }

  return context;
}
