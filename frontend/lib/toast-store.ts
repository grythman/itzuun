import { create } from "zustand";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message?: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, "id">) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) =>
    set((state) => {
      const id = generateId();
      // Optional: automatically remove toast if duration is set (not fully handling timeout here purely in state to keep it simple, wait for React effect)
      return { toasts: [{ ...toast, id }, ...state.toasts].slice(0, 5) };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));
