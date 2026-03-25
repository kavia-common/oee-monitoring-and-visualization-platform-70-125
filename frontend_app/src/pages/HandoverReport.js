import React, { useMemo, useState } from "react";
import "../App.css";
import { useAppStatus } from "../state/useAppStatus";
import { useAlerts } from "../context/AlertContext";
import { logger } from "../utils/logger";

// PUBLIC_INTERFACE
export function HandoverReport() {
  /** Generate and print/export a shift handover report. */
  const { api } = useAppStatus();
  const { push } = useAlerts();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateIso, setDateIso] = useState(today);
  const [shift, setShift] = useState("Day");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  async function generate() {
    setLoading(true);
    try {
      const res = await api.generateShiftHandoverReport({ dateIso, shift, notes });
      setReport(res?.report || null);
      push({ severity: "ok", title: "Report generated", message: "Ready to review and print.", ttlMs: 7000 });
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Report failed", message: e.message || "Error" });
    } finally {
      setLoading(false);
    }
  }

  function print() {
    window.print();
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Shift Handover Report</div>
            <div className="cardSub">Auto-generate a summary for the next shift</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btnPrimary" onClick={generate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </button>
            <button className="btn btnGhost" onClick={print} disabled={!report}>Print</button>
          </div>
        </div>

        <div className="formRow">
          <div className="field">
            <label>Date</label>
            <input className="input" type="date" value={dateIso} onChange={(e) => setDateIso(e.target.value)} />
          </div>
          <div className="field">
            <label>Shift</label>
            <select className="select" value={shift} onChange={(e) => setShift(e.target.value)}>
              <option>Day</option>
              <option>Swing</option>
              <option>Night</option>
            </select>
          </div>
        </div>

        <div className="field" style={{ marginTop: 12 }}>
          <label>Supervisor notes (optional)</label>
          <textarea className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key context for the next shift..." />
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">Generated Report</div>
        <div className="cardSub">This content comes from the API (or mock backend fallback)</div>

        {!report ? (
          <div className="helper" style={{ marginTop: 10 }}>Generate a report to preview it here.</div>
        ) : (
          <div style={{ marginTop: 10 }}>
            <div className="grid grid2">
              <div className="card" style={{ padding: 12 }}>
                <div className="cardTitle" style={{ fontSize: 13 }}>Header</div>
                <div className="helper" style={{ marginTop: 6 }}>
                  <div><strong>ID:</strong> {report.id}</div>
                  <div><strong>Generated:</strong> {new Date(report.generatedAt).toLocaleString()}</div>
                  <div><strong>Date:</strong> {report.dateIso}</div>
                  <div><strong>Shift:</strong> {report.shift}</div>
                  <div><strong>Line:</strong> {report.lineId}</div>
                </div>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="cardTitle" style={{ fontSize: 13 }}>KPIs</div>
                <div className="helper" style={{ marginTop: 6 }}>
                  <div><strong>Availability:</strong> {fmt(report.metrics?.availability)}</div>
                  <div><strong>Performance:</strong> {fmt(report.metrics?.performance)}</div>
                  <div><strong>Quality:</strong> {fmt(report.metrics?.quality)}</div>
                  <div><strong>OEE:</strong> {fmt(report.metrics?.oee)}</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 12, padding: 12 }}>
              <div className="cardTitle" style={{ fontSize: 13 }}>Output</div>
              <div className="helper" style={{ marginTop: 6 }}>
                Planned: <strong>{report.output?.plannedCount ?? "—"}</strong> • Good:{" "}
                <strong>{report.output?.goodCount ?? "—"}</strong> • Reject:{" "}
                <strong>{report.output?.rejectCount ?? "—"}</strong>
              </div>
            </div>

            <div className="grid grid2" style={{ marginTop: 12 }}>
              <div className="card" style={{ padding: 12 }}>
                <div className="cardTitle" style={{ fontSize: 13 }}>Top losses</div>
                <table className="table" aria-label="Top losses for report">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Loss</th>
                      <th>Minutes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(report.topLosses || []).map((x, idx) => (
                      <tr key={idx}>
                        <td>{x.category}</td>
                        <td>{x.label}</td>
                        <td>{x.minutes}</td>
                      </tr>
                    ))}
                    {!report.topLosses?.length ? <tr><td colSpan={3}>—</td></tr> : null}
                  </tbody>
                </table>
              </div>
              <div className="card" style={{ padding: 12 }}>
                <div className="cardTitle" style={{ fontSize: 13 }}>Action items</div>
                <ul style={{ marginTop: 8, color: "rgba(17,24,39,.8)" }}>
                  {(report.actionItems || []).map((x, idx) => (
                    <li key={idx} style={{ marginBottom: 6 }}>{x}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="card" style={{ marginTop: 12, padding: 12 }}>
              <div className="cardTitle" style={{ fontSize: 13 }}>Notes</div>
              <div className="helper" style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{report.notes || "—"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="cardTitle">Export</div>
        <div className="cardSub">Print uses the browser print dialog; PDF export is available there.</div>
        <div className="helper" style={{ marginTop: 8 }}>
          If the backend later supports file export, this screen can be extended to download PDF/CSV.
        </div>
      </div>
    </div>
  );
}

function fmt(v) {
  if (v === null || v === undefined) return "—";
  return `${Math.round(Number(v) * 1000) / 10}%`;
}
