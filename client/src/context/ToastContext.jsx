import { createContext, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { Button } from "../components/ui/button";

const ToastContext = createContext(null);

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function showToast({ title, message, type = "info" }) {
    const id = crypto.randomUUID();
    setToasts((items) => [...items, { id, title, message, type }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((item) => item.id !== id));
    }, 4200);
  }

  const value = useMemo(() => ({ showToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[min(92vw,380px)] flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = iconMap[toast.type] || Info;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 24, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 24, scale: 0.98 }}
                className="glass rounded-lg border border-border p-4 shadow-premium"
              >
                <div className="flex gap-3">
                  <Icon className={toast.type === "error" ? "text-danger" : toast.type === "success" ? "text-accent" : "text-primary"} size={20} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{toast.title}</div>
                    {toast.message && <div className="mt-1 text-sm leading-5 text-foreground/62">{toast.message}</div>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
