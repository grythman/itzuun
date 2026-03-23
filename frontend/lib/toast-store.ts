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
  push: (type: "success" | "error" | "info" | "warning", title: string, message?: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (type, title, message) =>
    set((state) => {
      const id = generateId();
      return { toasts: [{ id, type, title, message }, ...state.toasts].slice(0, 5) };
    }),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  clearAll: () => set({ toasts: [] }),
}));
