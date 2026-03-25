import React from "react";
import "../App.css";
import { useAlerts } from "../context/AlertContext";

function clsFor(sev) {
  if (sev === "warn") return "alert alertWarn";
  if (sev === "error") return "alert alertError";
  if (sev === "ok") return "alert alertOk";
  return "alert alertInfo";
}

// PUBLIC_INTERFACE
export function AlertStack() {
  /** Renders sticky alerts in the bottom-right corner. */
  const { alerts, dismiss } = useAlerts();

  return (
    <div className="alertStack" aria-live="polite" aria-relevant="additions removals">
      {alerts.map((a) => (
        <div className={clsFor(a.severity)} key={a.id}>
          <div className="alertHeader">
            <div className="alertTitle">{a.title}</div>
            <button className="btn btnGhost" onClick={() => dismiss(a.id)} aria-label="Dismiss alert">
              Dismiss
            </button>
          </div>
          {a.message ? <div className="alertBody">{a.message}</div> : null}
        </div>
      ))}
    </div>
  );
}
