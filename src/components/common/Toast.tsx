"use client";

import {
  createContext, useCallback, useContext, useEffect, useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface Ctx {
  show: (message: string, type?: ToastType) => void;
}

const ToastCtx = createContext<Ctx>({ show: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDone={() =>
            setToasts((prev) => prev.filter((x) => x.id !== t.id))
          } />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const accent =
    toast.type === "success" ? "border-accent-green/60 bg-[#0A1F12]"
    : toast.type === "error" ? "border-accent-red/60 bg-[#1A0606]"
    : "border-accent-cyan/60 bg-[#091E2A]";

  return (
    <div className={`pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-sm font-medium text-text-primary shadow-card backdrop-blur-sm animate-slide-y ${accent}`}>
      {toast.message}
    </div>
  );
}

export function useToast(): Ctx { return useContext(ToastCtx); }
