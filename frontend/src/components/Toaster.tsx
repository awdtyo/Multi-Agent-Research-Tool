import { create } from "zustand";
import { cn, uid } from "@/lib/utils";

export interface ToastItem {
  id: string;
  message: string;
  tone: "info" | "error";
}

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, tone?: ToastItem["tone"]) => void;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>()((set) => ({
  toasts: [],
  push: (message, tone = "info") => {
    const id = uid();
    set((state) => ({ toasts: [...state.toasts, { id, message, tone }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3200);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

export function showToast(message: string): void {
  useToasts.getState().push(message);
}

export function Toaster(): React.JSX.Element {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto rounded-card border px-3.5 py-2 text-sm shadow-2",
            "border-hair bg-surface-2 text-text",
            toast.tone === "error" && "border-danger/40 text-danger",
          )}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
