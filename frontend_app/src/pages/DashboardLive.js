import React, { useEffect, useMemo, useState } from "react";
import "../App.css";
import { KpiTile, SparkBars } from "../components/Kpi";
import { useAppStatus } from "../state/useAppStatus";
import { useAuth } from "../context/AuthContext";
import { useAlerts } from "../context/AlertContext";
import { logger } from "../utils/logger";

function toIso(dt) {
  return dt.toISOString();
}

// PUBLIC_INTERFACE
export function DashboardLive() {
  /** Live OEE dashboard with realtime refresh triggers and latest events. */
  const { api, rt } = useAppStatus();
  const { user } = useAuth();
  const { push } = useAlerts();

  const [overview, setOverview] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const timeRange = useMemo(() => {
    const end = new Date();
    const start = new Date(end.getTime() - 8 * 60 * 60 * 1000);
    return { start, end };
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const data = await api.getOverview({
        startIso: toIso(timeRange.start),
        endIso: toIso(timeRange.end),
        lineId: user.lineId,
      });
      setOverview(data);

      const ev = await api.listEvents({ limit: 10 });
      setEvents(ev || []);
    } catch (e) {
      logger.error(e);
      push({ severity: "error", title: "Refresh failed", message: e.message || "Could not load data." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.lineId]);

  useEffect(() => {
    const off1 = rt.on("oee:update", () => refresh());
    const off2 = rt.on("alert:new", (a) => push({ ...a, ttlMs: 12_000 }));
    return () => {
      off1?.();
      off2?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rt, user.lineId]);

  const m = overview?.metrics;
  const t = overview?.target;

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Live OEE</div>
            <div className="cardSub">
              Line <strong>{overview?.lineId || user.lineId}</strong> • Updated{" "}
              <strong>{overview?.updatedAt ? new Date(overview.updatedAt).toLocaleTimeString() : "—"}</strong>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btnGhost" onClick={() => refresh()} disabled={loading}>
              Refresh
            </button>
            <button
              className="btn btnWarning"
              onClick={() =>
                push({
                  severity: "warn",
                  title: "Manual alert",
                  message: "This is a demo alert. In production this would be triggered by rules.",
                })
              }
            >
              Trigger Alert
            </button>
          </div>
        </div>

        <div className="metricRow">
          <KpiTile label="Availability" value={m?.availability} target={t?.availability} hint="Uptime / Planned" />
          <KpiTile label="Performance" value={m?.performance} target={t?.performance} hint="Speed loss" />
          <KpiTile label="Quality" value={m?.quality} target={t?.quality} hint="Good / Total" />
          <KpiTile label="OEE" value={m?.oee} target={t?.oee} hint="A × P × Q" />
        </div>

        <div className="grid grid2" style={{ marginTop: 12 }}>
          <div className="card" style={{ padding: 12 }}>
            <div className="cardTitle" style={{ fontSize: 13 }}>OEE Trend</div>
            <div className="cardSub">Last ~hour (spark)</div>
            <SparkBars series={overview?.spark?.oee || []} />
          </div>
          <div className="card" style={{ padding: 12 }}>
            <div className="cardTitle" style={{ fontSize: 13 }}>Loss Drivers (heuristic)</div>
            <div className="cardSub">Quick glance categories</div>
            <div className="formRow" style={{ marginTop: 8 }}>
              <div className="metric" style={{ background: "rgba(239,68,68,.06)", borderColor: "rgba(239,68,68,.16)" }}>
                <div className="metricLabel">Downtime</div>
                <div className="metricValue" style={{ fontSize: 20 }}>High</div>
                <div className="mini"><span className="badge badgeWarn">Top: Jam</span><span>Investigate sensors</span></div>
              </div>
              <div className="metric" style={{ background: "rgba(245,158,11,.06)", borderColor: "rgba(245,158,11,.20)" }}>
                <div className="metricLabel">Quality</div>
                <div className="metricValue" style={{ fontSize: 20 }}>Stable</div>
                <div className="mini"><span className="badge badgeOk">Top: Label</span><span>Monitor rejects</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid2">
        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Latest Events</div>
              <div className="cardSub">Production, downtime and quality logs</div>
            </div>
          </div>
          <table className="table" aria-label="Latest events">
            <thead>
              <tr>
                <th>Time</th>
                <th>Type</th>
                <th>Details</th>
                <th>User</th>
              </tr>
            </thead>
            <tbody>
              {(events || []).map((e) => (
                <tr key={e.id}>
                  <td>{e.at ? new Date(e.at).toLocaleTimeString() : "—"}</td>
                  <td>
                    <span className={`badge ${e.type === "downtime" ? "badgeBad" : e.type === "quality" ? "badgeWarn" : "badgeOk"}`}>
                      {e.type}
                    </span>
                  </td>
                  <td style={{ color: "rgba(17,24,39,.8)" }}>
                    {e.type === "downtime" ? `${e.reason || "Downtime"} • ${e.minutes || 0} min` : null}
                    {e.type === "quality" ? `${e.defect || "Quality"} • ${e.count || 0} pcs` : null}
                    {e.type === "production"
                      ? `${e.product || "Product"} • Good ${e.goodCount ?? "—"} / Reject ${e.rejectCount ?? "—"}`
                      : null}
                  </td>
                  <td>{e.user || "—"}</td>
                </tr>
              ))}
              {!events?.length ? (
                <tr>
                  <td colSpan={4} style={{ color: "rgba(17,24,39,.6)" }}>
                    No events yet. Use the Logging screen to add some.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="cardHeader">
            <div>
              <div className="cardTitle">Realtime Notes</div>
              <div className="cardSub">Socket.IO updates trigger dashboard refresh</div>
            </div>
          </div>
          <div className="helper">
            This UI listens for:
            <ul>
              <li><code>oee:update</code> — refreshes overview + recent events</li>
              <li><code>alert:new</code> — pushes a sticky notification</li>
            </ul>
            When the backend is unavailable, the app automatically switches to mock data and a timer-based realtime stream.
          </div>
        </div>
      </div>
    </div>
  );
}
