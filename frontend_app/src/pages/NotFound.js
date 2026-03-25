import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

// PUBLIC_INTERFACE
export function NotFound() {
  /** Fallback for unknown routes. */
  return (
    <div className="card">
      <div className="cardTitle">Page not found</div>
      <div className="cardSub">The route you visited doesn’t exist.</div>
      <div style={{ marginTop: 12 }}>
        <Link to="/dashboards/live" className="btn btnPrimary">Go to Live Dashboard</Link>
      </div>
    </div>
  );
}
