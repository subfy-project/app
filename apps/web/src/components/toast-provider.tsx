"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ToastVariant = "error" | "success" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  closing?: boolean;
}

interface ToastContextValue {
  showToast: (input: {
    title: string;
    description?: string;
    variant?: ToastVariant;
    durationMs?: number;
  }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string, immediate = false) => {
    if (immediate) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, closing: true } : item)),
    );
    window.setTimeout(() => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }, 180);
  }, []);

  const showToast = useCallback(
    (input: {
      title: string;
      description?: string;
      variant?: ToastVariant;
      durationMs?: number;
    }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const durationMs = input.durationMs ?? 5000;
      setItems((prev) => [
        ...prev,
        {
          id,
          title: input.title,
          description: input.description,
          variant: input.variant ?? "info",
          closing: false,
        },
      ]);
      window.setTimeout(() => removeToast(id), durationMs);
    },
    [removeToast],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  useEffect(() => {
    return () => {
      setItems([]);
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => {
          const icon =
            item.variant === "success" ? (
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-300" />
            ) : (
              <AlertCircle className="mt-0.5 size-4 text-red-300" />
            );
          const borderColor =
            item.variant === "success" ? "border-emerald-400/40" : "border-red-400/40";
          return (
            <div
              key={item.id}
              className={`pointer-events-auto rounded-lg border bg-neutral-900/95 p-3 shadow-2xl backdrop-blur transition-all duration-200 ease-out ${
                item.closing
                  ? "translate-y-2 opacity-0 scale-[0.98]"
                  : "translate-y-0 opacity-100 scale-100"
              } ${borderColor}`}
            >
              <div className="flex items-start gap-2">
                {icon}
                <div className="min-w-0 flex-1">
                  <p className="font-inter text-sm font-semibold text-text-primary">
                    {item.title}
                  </p>
                  {item.description ? (
                    <p className="mt-0.5 line-clamp-3 font-outfit text-xs text-text-secondary">
                      {item.description}
                    </p>
                  ) : null}
                </div>
                <button
                  className="rounded p-1 text-text-secondary hover:text-text-primary"
                  onClick={() => removeToast(item.id)}
                  aria-label="Close notification"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return value;
}
