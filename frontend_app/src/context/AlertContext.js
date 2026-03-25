import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const AlertContext = createContext(null);

// PUBLIC_INTERFACE
export function AlertProvider({ children }) {
  /** Provides sticky alert/toast notifications with de-dupe and auto-expire. */
  const [alerts, setAlerts] = useState([]);
  const idSetRef = useRef(new Set());

  const push = useCallback((alert) => {
    const id = alert.id || `local_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    if (idSetRef.current.has(id)) return;

    idSetRef.current.add(id);
    const entry = {
      id,
      severity: alert.severity || "info", // info|warn|error|ok
      title: alert.title || "Notification",
      message: alert.message || "",
      createdAt: alert.createdAt || new Date().toISOString(),
      ttlMs: typeof alert.ttlMs === "number" ? alert.ttlMs : 10_000,
    };

    setAlerts((prev) => [entry, ...prev].slice(0, 6));

    if (entry.ttlMs > 0) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        idSetRef.current.delete(id);
      }, entry.ttlMs);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    idSetRef.current.delete(id);
  }, []);

  const value = useMemo(() => ({ alerts, push, dismiss }), [alerts, push, dismiss]);

  return <AlertContext.Provider value={value}>{children}</AlertContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAlerts() {
  /** Hook to access alert push/dismiss and current stack. */
  const ctx = useContext(AlertContext);
  if (!ctx) throw new Error("useAlerts must be used within AlertProvider");
  return ctx;
}
