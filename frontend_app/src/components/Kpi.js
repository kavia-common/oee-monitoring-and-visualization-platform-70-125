import React from "react";
import "../App.css";

function toPct(v) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return "—";
  return `${Math.round(Number(v) * 1000) / 10}%`;
}

function badgeClass(actual, target) {
  if (target === undefined || target === null) return "badge";
  if (actual >= target) return "badge badgeOk";
  if (actual >= target * 0.92) return "badge badgeWarn";
  return "badge badgeBad";
}

// PUBLIC_INTERFACE
export function KpiTile({ label, value, target, hint }) {
  /** Shows KPI label/value, target marker and hint. */
  return (
    <div className="metric">
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{toPct(value)}</div>
      <div className="mini">
        <span className={badgeClass(value, target)}>
          Target: {toPct(target)}
        </span>
        <span>{hint || ""}</span>
      </div>
      <div className="kpiBar" aria-hidden="true">
        <div className="kpiFill" style={{ width: `${Math.max(0, Math.min(100, (Number(value) || 0) * 100))}%` }} />
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function SparkBars({ series }) {
  /** Tiny bar sparkline using divs (no charting lib). */
  const s = Array.isArray(series) ? series : [];
  const max = Math.max(0.0001, ...s.map((v) => Number(v) || 0));
  return (
    <div className="spark" role="img" aria-label="Trend chart">
      {s.map((v, idx) => (
        <div
          key={idx}
          className="sparkBar"
          style={{ height: `${Math.max(6, ((Number(v) || 0) / max) * 100)}%` }}
          title={`${Math.round((Number(v) || 0) * 1000) / 10}%`}
        />
      ))}
    </div>
  );
}
