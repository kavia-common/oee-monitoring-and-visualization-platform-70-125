import React, { useEffect, useState } from "react";
import "../App.css";
import { useAppStatus } from "../state/useAppStatus";
import { useAlerts } from "../context/AlertContext";
import { logger } from "../utils/logger";

// PUBLIC_INTERFACE
export function AlertsPage() {
  /** Shows active alerts and allows acknowledgment. */
  const { api, rt } = useAppStatus();
  const { push } = useAlerts();
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.getAlerts();
      setActive(data || []);
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Alerts failed to load", message: e.message || "Error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const off = rt.on("alert:new", (a) => {
      push({ ...a, ttlMs: 12_000 });
      refresh();
    });
    return () => off?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt]);

  async function ack(id) {
    try {
      await api.acknowledgeAlert(id);
      push({ severity: "ok", title: "Acknowledged", message: "Alert acknowledged.", ttlMs: 7000 });
      refresh();
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Ack failed", message: e.message || "Error" });
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Active Alerts</div>
            <div className="cardSub">Sticky notifications also appear bottom-right</div>
          </div>
          <button className="btn btnGhost" onClick={refresh} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <table className="table" aria-label="Active alerts table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Title</th>
              <th>Message</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(active || []).map((a) => (
              <tr key={a.id}>
                <td>{a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}</td>
                <td>
                  <span className={`badge ${a.severity === "error" ? "badgeBad" : a.severity === "warn" ? "badgeWarn" : "badgeOk"}`}>
                    {a.severity || "info"}
                  </span>
                </td>
                <td style={{ fontWeight: 900 }}>{a.title}</td>
                <td style={{ color: "rgba(17,24,39,.78)" }}>{a.message}</td>
                <td>
                  <button className="btn btnPrimary" onClick={() => ack(a.id)}>Acknowledge</button>
                </td>
              </tr>
            ))}
            {!active?.length ? (
              <tr>
                <td colSpan={5} style={{ color: "rgba(17,24,39,.6)" }}>
                  No active alerts.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="cardTitle">Alerting model (UI)</div>
        <div className="cardSub">
          In production this would be driven by backend rules (thresholds, SPC, downtime streaks).
        </div>
        <div className="helper" style={{ marginTop: 8 }}>
          The realtime client listens for <code>alert:new</code> events and shows a toast + refreshes this table.
        </div>
      </div>
    </div>
  );
}
