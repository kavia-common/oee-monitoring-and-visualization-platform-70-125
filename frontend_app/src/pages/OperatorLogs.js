import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { Modal } from "../components/Modal";
import { useAppStatus } from "../state/useAppStatus";
import { useAuth, canAccess } from "../context/AuthContext";
import { useAlerts } from "../context/AlertContext";
import { logger } from "../utils/logger";

function nowIso() {
  return new Date().toISOString();
}

function basePayload(user) {
  return { lineId: user.lineId, user: user.name, at: nowIso() };
}

// PUBLIC_INTERFACE
export function OperatorLogs() {
  /** Data entry for production runs, downtime events and quality events. */
  const { api } = useAppStatus();
  const { user } = useAuth();
  const { push } = useAlerts();

  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(null); // "production"|"downtime"|"quality"|null
  const [saving, setSaving] = useState(false);

  const canLog = useMemo(() => canAccess(user.role, "logProduction"), [user.role]);

  async function refresh() {
    try {
      const ev = await api.listEvents({ limit: 25 });
      setEvents(ev || []);
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Could not load logs", message: e.message || "Error" });
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.lineId]);

  async function submit(form) {
    setSaving(true);
    try {
      if (modal === "production") await api.createProductionRun(form);
      if (modal === "downtime") await api.createDowntime(form);
      if (modal === "quality") await api.createQualityEvent(form);

      push({ severity: "ok", title: "Saved", message: "Log entry recorded.", ttlMs: 7000 });
      setModal(null);
      await refresh();
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Save failed", message: e.message || "Error saving log." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Logging</div>
            <div className="cardSub">Capture production runs, downtime, and quality events</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" onClick={() => setModal("production")} disabled={!canLog}>
              Log Production Run
            </button>
            <button className="btn btnWarning" onClick={() => setModal("downtime")} disabled={!canLog}>
              Log Downtime
            </button>
            <button className="btn" onClick={() => setModal("quality")} disabled={!canLog}>
              Log Quality
            </button>
          </div>
        </div>

        {!canLog ? (
          <div className="helper">
            Your current role (<strong>{user.role}</strong>) can’t submit logs. Switch to Operator or Shift Supervisor.
          </div>
        ) : null}
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Recent Logs</div>
            <div className="cardSub">Most recent 25 entries</div>
          </div>
          <button className="btn btnGhost" onClick={refresh}>Refresh</button>
        </div>

        <table className="table" aria-label="Recent logs table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Line</th>
              <th>Details</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {(events || []).map((e) => (
              <tr key={e.id}>
                <td>{e.at ? new Date(e.at).toLocaleString() : "—"}</td>
                <td>
                  <span className={`badge ${e.type === "downtime" ? "badgeBad" : e.type === "quality" ? "badgeWarn" : "badgeOk"}`}>
                    {e.type}
                  </span>
                </td>
                <td>{e.lineId || "—"}</td>
                <td>
                  {e.type === "production" ? (
                    <span>
                      {e.product || "Product"} • Planned {e.plannedCount ?? "—"} • Good {e.goodCount ?? "—"} • Reject {e.rejectCount ?? "—"}
                    </span>
                  ) : null}
                  {e.type === "downtime" ? (
                    <span>
                      {e.reason || "Reason"} • {e.minutes ?? 0} min
                    </span>
                  ) : null}
                  {e.type === "quality" ? (
                    <span>
                      {e.defect || "Defect"} • {e.count ?? 0} pcs
                    </span>
                  ) : null}
                </td>
                <td>{e.user || "—"}</td>
              </tr>
            ))}
            {!events?.length ? (
              <tr>
                <td colSpan={5} style={{ color: "rgba(17,24,39,.6)" }}>
                  No logs yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {modal ? (
        <LogModal
          type={modal}
          user={user}
          saving={saving}
          onClose={() => setModal(null)}
          onSubmit={submit}
        />
      ) : null}
    </div>
  );
}

function LogModal({ type, user, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => {
    const base = basePayload(user);
    if (type === "production") {
      return {
        ...base,
        product: "SKU-103",
        plannedCount: 1200,
        goodCount: 1100,
        rejectCount: 25,
        idealCycleTimeSec: 1.6,
        runtimeMin: 360,
        downtimeMin: 24,
      };
    }
    if (type === "downtime") {
      return { ...base, reason: "Jam at infeed", minutes: 8 };
    }
    return { ...base, defect: "Label misprint", count: 10 };
  });

  const title =
    type === "production" ? "Log Production Run" : type === "downtime" ? "Log Downtime Event" : "Log Quality Event";

  return (
    <Modal
      title={title}
      subtitle={`Line ${user.lineId} • ${user.name}`}
      onClose={onClose}
      actions={
        <>
          <button className="btn btnGhost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btnPrimary" onClick={() => onSubmit(form)} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </>
      }
    >
      {type === "production" ? (
        <div className="grid" style={{ gap: 12 }}>
          <div className="formRow">
            <div className="field">
              <label>Product / SKU</label>
              <input className="input" value={form.product} onChange={(e) => setForm((f) => ({ ...f, product: e.target.value }))} />
            </div>
            <div className="field">
              <label>Ideal cycle time (sec)</label>
              <input className="input" type="number" value={form.idealCycleTimeSec}
                onChange={(e) => setForm((f) => ({ ...f, idealCycleTimeSec: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="formRow">
            <div className="field">
              <label>Planned count</label>
              <input className="input" type="number" value={form.plannedCount}
                onChange={(e) => setForm((f) => ({ ...f, plannedCount: Number(e.target.value) }))} />
            </div>
            <div className="field">
              <label>Good count</label>
              <input className="input" type="number" value={form.goodCount}
                onChange={(e) => setForm((f) => ({ ...f, goodCount: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="formRow">
            <div className="field">
              <label>Reject count</label>
              <input className="input" type="number" value={form.rejectCount}
                onChange={(e) => setForm((f) => ({ ...f, rejectCount: Number(e.target.value) }))} />
            </div>
            <div className="field">
              <label>Runtime (min)</label>
              <input className="input" type="number" value={form.runtimeMin}
                onChange={(e) => setForm((f) => ({ ...f, runtimeMin: Number(e.target.value) }))} />
            </div>
          </div>

          <div className="formRow">
            <div className="field">
              <label>Downtime within run (min)</label>
              <input className="input" type="number" value={form.downtimeMin}
                onChange={(e) => setForm((f) => ({ ...f, downtimeMin: Number(e.target.value) }))} />
            </div>
            <div className="field">
              <label>Timestamp</label>
              <input className="input" value={form.at} onChange={(e) => setForm((f) => ({ ...f, at: e.target.value }))} />
              <div className="helper">ISO timestamp (editable for backfill)</div>
            </div>
          </div>
        </div>
      ) : null}

      {type === "downtime" ? (
        <div className="grid" style={{ gap: 12 }}>
          <div className="formRow">
            <div className="field">
              <label>Reason</label>
              <input className="input" value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="field">
              <label>Minutes</label>
              <input className="input" type="number" value={form.minutes}
                onChange={(e) => setForm((f) => ({ ...f, minutes: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="field">
            <label>Notes</label>
            <textarea className="textarea" value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="field">
            <label>Timestamp</label>
            <input className="input" value={form.at} onChange={(e) => setForm((f) => ({ ...f, at: e.target.value }))} />
          </div>
        </div>
      ) : null}

      {type === "quality" ? (
        <div className="grid" style={{ gap: 12 }}>
          <div className="formRow">
            <div className="field">
              <label>Defect</label>
              <input className="input" value={form.defect} onChange={(e) => setForm((f) => ({ ...f, defect: e.target.value }))} />
            </div>
            <div className="field">
              <label>Count</label>
              <input className="input" type="number" value={form.count}
                onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="field">
            <label>Containment / Notes</label>
            <textarea className="textarea" value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="field">
            <label>Timestamp</label>
            <input className="input" value={form.at} onChange={(e) => setForm((f) => ({ ...f, at: e.target.value }))} />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
