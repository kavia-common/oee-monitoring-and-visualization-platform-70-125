import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { useAppStatus } from "../state/useAppStatus";
import { useAlerts } from "../context/AlertContext";
import { KpiTile } from "../components/Kpi";
import { logger } from "../utils/logger";

// PUBLIC_INTERFACE
export function ShiftAnalysis() {
  /** Shift analysis and shift-to-shift comparison. */
  const { api } = useAppStatus();
  const { push } = useAlerts();

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [dateIso, setDateIso] = useState(today);
  const [shiftA, setShiftA] = useState("Day");
  const [shiftB, setShiftB] = useState("Night");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const d = await api.getShiftComparison({ dateIso, shiftA, shiftB });
      setData(d);
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Shift comparison failed", message: e.message || "Error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const a = data?.a;
  const b = data?.b;

  function delta(x, y) {
    if (x === undefined || y === undefined) return "—";
    const d = (Number(x) || 0) - (Number(y) || 0);
    const pct = Math.round(d * 1000) / 10;
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Shift Analysis</div>
            <div className="cardSub">Compare OEE metrics across shifts for the same date</div>
          </div>
          <button className="btn btnPrimary" onClick={refresh} disabled={loading}>
            {loading ? "Comparing..." : "Compare"}
          </button>
        </div>

        <div className="formRow">
          <div className="field">
            <label>Date</label>
            <input className="input" type="date" value={dateIso} onChange={(e) => setDateIso(e.target.value)} />
          </div>
          <div className="field">
            <label>Shift A</label>
            <select className="select" value={shiftA} onChange={(e) => setShiftA(e.target.value)}>
              <option>Day</option>
              <option>Swing</option>
              <option>Night</option>
            </select>
          </div>
        </div>

        <div className="formRow" style={{ marginTop: 12 }}>
          <div className="field">
            <label>Shift B</label>
            <select className="select" value={shiftB} onChange={(e) => setShiftB(e.target.value)}>
              <option>Day</option>
              <option>Swing</option>
              <option>Night</option>
            </select>
          </div>
          <div className="field">
            <label>Insight</label>
            <div className="helper">
              Look for major deltas: downtime (availability), speed loss (performance), rejects (quality).
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">{a?.shift || shiftA} Shift</div>
              <div className="cardSub">Output and top losses</div>
            </div>
          </div>
          <div className="metricRow">
            <KpiTile label="Availability" value={a?.metrics?.availability} target={0.85} />
            <KpiTile label="Performance" value={a?.metrics?.performance} target={0.9} />
            <KpiTile label="Quality" value={a?.metrics?.quality} target={0.98} />
            <KpiTile label="OEE" value={a?.metrics?.oee} target={0.75} />
          </div>

          <div className="card" style={{ marginTop: 12, padding: 12 }}>
            <div className="cardTitle" style={{ fontSize: 13 }}>Top losses</div>
            <table className="table" aria-label="Top losses A">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Loss</th>
                  <th>Minutes</th>
                </tr>
              </thead>
              <tbody>
                {(a?.topLosses || []).map((x, idx) => (
                  <tr key={idx}>
                    <td>{x.category}</td>
                    <td>{x.label}</td>
                    <td>{x.minutes}</td>
                  </tr>
                ))}
                {!a?.topLosses?.length ? (
                  <tr><td colSpan={3} style={{ color: "rgba(17,24,39,.6)" }}>—</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">{b?.shift || shiftB} Shift</div>
              <div className="cardSub">Output and top losses</div>
            </div>
          </div>
          <div className="metricRow">
            <KpiTile label="Availability" value={b?.metrics?.availability} target={0.85} />
            <KpiTile label="Performance" value={b?.metrics?.performance} target={0.9} />
            <KpiTile label="Quality" value={b?.metrics?.quality} target={0.98} />
            <KpiTile label="OEE" value={b?.metrics?.oee} target={0.75} />
          </div>

          <div className="card" style={{ marginTop: 12, padding: 12 }}>
            <div className="cardTitle" style={{ fontSize: 13 }}>Top losses</div>
            <table className="table" aria-label="Top losses B">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Loss</th>
                  <th>Minutes</th>
                </tr>
              </thead>
              <tbody>
                {(b?.topLosses || []).map((x, idx) => (
                  <tr key={idx}>
                    <td>{x.category}</td>
                    <td>{x.label}</td>
                    <td>{x.minutes}</td>
                  </tr>
                ))}
                {!b?.topLosses?.length ? (
                  <tr><td colSpan={3} style={{ color: "rgba(17,24,39,.6)" }}>—</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Delta Summary (A − B)</div>
            <div className="cardSub">Positive means Shift A is higher</div>
          </div>
        </div>

        <div className="grid grid4">
          <div className="metric">
            <div className="metricLabel">Availability</div>
            <div className="metricValue" style={{ fontSize: 20 }}>{delta(a?.metrics?.availability * 100, b?.metrics?.availability * 100)}</div>
            <div className="mini"><span className="badge">Downtime impact</span><span /></div>
          </div>
          <div className="metric">
            <div className="metricLabel">Performance</div>
            <div className="metricValue" style={{ fontSize: 20 }}>{delta(a?.metrics?.performance * 100, b?.metrics?.performance * 100)}</div>
            <div className="mini"><span className="badge">Speed loss</span><span /></div>
          </div>
          <div className="metric">
            <div className="metricLabel">Quality</div>
            <div className="metricValue" style={{ fontSize: 20 }}>{delta(a?.metrics?.quality * 100, b?.metrics?.quality * 100)}</div>
            <div className="mini"><span className="badge">Rejects</span><span /></div>
          </div>
          <div className="metric">
            <div className="metricLabel">OEE</div>
            <div className="metricValue" style={{ fontSize: 20 }}>{delta(a?.metrics?.oee * 100, b?.metrics?.oee * 100)}</div>
            <div className="mini"><span className="badge">Overall</span><span /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
