import React, { useEffect } from "react";
import "../App.css";

// PUBLIC_INTERFACE
export function Modal({ title, subtitle, children, onClose, actions }) {
  /** Accessible modal with escape-to-close and overlay click. */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-label={title || "Dialog"}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modalTop">
          <div style={{ minWidth: 0 }}>
            <div className="cardTitle" style={{ fontSize: 14 }}>{title}</div>
            {subtitle ? <div className="cardSub">{subtitle}</div> : null}
          </div>
          <button className="btn btnGhost" onClick={onClose} aria-label="Close dialog">Close</button>
        </div>
        <div className="modalBody">{children}</div>
        {actions ? <div className="modalActions">{actions}</div> : null}
      </div>
    </div>
  );
}
