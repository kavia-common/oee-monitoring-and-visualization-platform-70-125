import { logger } from "../utils/logger";
import { computeOee } from "../domain/oee";

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function mkSeries(n, base, jitter) {
  const out = [];
  let v = base;
  for (let i = 0; i < n; i++) {
    v = clamp01(v + (Math.random() - 0.5) * jitter);
    out.push(v);
  }
  return out;
}

const db = {
  events: [],
  alerts: [
    {
      id: "a1",
      severity: "warn",
      title: "OEE trending down",
      message: "Line A OEE dropped below target (75%) in last 30 minutes.",
      createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
      acknowledged: false,
    },
  ],
};

function seed() {
  if (db.events.length) return;
  const now = Date.now();
  db.events.push(
    {
      id: uid("evt"),
      type: "downtime",
      lineId: "LINE_A",
      reason: "Jam at infeed",
      minutes: 12,
      at: new Date(now - 70 * 60 * 1000).toISOString(),
      user: "operator@floor",
    },
    {
      id: uid("evt"),
      type: "quality",
      lineId: "LINE_A",
      defect: "Label misprint",
      count: 18,
      at: new Date(now - 55 * 60 * 1000).toISOString(),
      user: "operator@floor",
    },
    {
      id: uid("evt"),
      type: "production",
      lineId: "LINE_A",
      product: "SKU-103",
      plannedCount: 1200,
      goodCount: 1088,
      rejectCount: 24,
      idealCycleTimeSec: 1.6,
      runtimeMin: 360,
      downtimeMin: 24,
      at: new Date(now - 35 * 60 * 1000).toISOString(),
      user: "supervisor@shift",
    }
  );
}

function overview() {
  const availability = clamp01(0.82 + (Math.random() - 0.5) * 0.05);
  const performance = clamp01(0.88 + (Math.random() - 0.5) * 0.06);
  const quality = clamp01(0.97 + (Math.random() - 0.5) * 0.02);
  const { oee } = computeOee({ availability, performance, quality });

  const spark = {
    oee: mkSeries(18, oee, 0.06),
    availability: mkSeries(18, availability, 0.05),
    performance: mkSeries(18, performance, 0.05),
    quality: mkSeries(18, quality, 0.02),
  };

  return {
    lineId: "LINE_A",
    updatedAt: new Date().toISOString(),
    metrics: { availability, performance, quality, oee },
    target: { oee: 0.75, availability: 0.85, performance: 0.9, quality: 0.98 },
    spark,
  };
}

function shiftSummary({ dateIso, shift }) {
  const base = overview();
  const factor = shift === "Night" ? 0.95 : shift === "Swing" ? 0.98 : 1.0;
  const metrics = {
    availability: clamp01(base.metrics.availability * factor),
    performance: clamp01(base.metrics.performance * factor),
    quality: clamp01(base.metrics.quality * 0.995),
  };
  const { oee } = computeOee(metrics);

  const topLosses = [
    { category: "Downtime", label: "Changeover", minutes: Math.round(22 * (1 / factor)) },
    { category: "Downtime", label: "Jam", minutes: Math.round(14 * (1 / factor)) },
    { category: "Performance", label: "Micro-stops", minutes: Math.round(9 * (1 / factor)) },
    { category: "Quality", label: "Label issues", minutes: Math.round(6 * (1 / factor)) },
  ];

  return {
    dateIso: dateIso || new Date().toISOString().slice(0, 10),
    shift: shift || "Day",
    lineId: "LINE_A",
    updatedAt: new Date().toISOString(),
    metrics: { ...metrics, oee },
    output: {
      plannedCount: 1400,
      goodCount: Math.round(1180 * factor),
      rejectCount: Math.round(28 * (2 - factor)),
    },
    topLosses,
  };
}

function shiftCompare({ dateIso, shiftA, shiftB }) {
  const a = shiftSummary({ dateIso, shift: shiftA || "Day" });
  const b = shiftSummary({ dateIso, shift: shiftB || "Night" });
  return {
    dateIso: dateIso || new Date().toISOString().slice(0, 10),
    shiftA: a.shift,
    shiftB: b.shift,
    a,
    b,
  };
}

export function createMockBackend() {
  seed();

  return {
    async request(path, { method, body }) {
      // Very small router
      await new Promise((r) => setTimeout(r, 250 + Math.random() * 300));

      if (method === "GET" && path.startsWith("/oee/overview")) return overview();
      if (method === "GET" && path.startsWith("/shifts/summary")) {
        const u = new URL(`http://local${path}`);
        return shiftSummary({ dateIso: u.searchParams.get("date"), shift: u.searchParams.get("shift") });
      }
      if (method === "GET" && path.startsWith("/shifts/compare")) {
        const u = new URL(`http://local${path}`);
        return shiftCompare({
          dateIso: u.searchParams.get("date"),
          shiftA: u.searchParams.get("shiftA"),
          shiftB: u.searchParams.get("shiftB"),
        });
      }
      if (method === "GET" && path.startsWith("/events")) {
        const u = new URL(`http://local${path}`);
        const limit = Number(u.searchParams.get("limit") || "50");
        return db.events.slice().sort((x, y) => (x.at < y.at ? 1 : -1)).slice(0, limit);
      }
      if (method === "POST" && path === "/logs/production-runs") {
        const evt = { id: uid("evt"), type: "production", at: new Date().toISOString(), ...body };
        db.events.push(evt);
        return { ok: true, event: evt };
      }
      if (method === "POST" && path === "/logs/downtime") {
        const evt = { id: uid("evt"), type: "downtime", at: new Date().toISOString(), ...body };
        db.events.push(evt);
        return { ok: true, event: evt };
      }
      if (method === "POST" && path === "/logs/quality") {
        const evt = { id: uid("evt"), type: "quality", at: new Date().toISOString(), ...body };
        db.events.push(evt);
        return { ok: true, event: evt };
      }
      if (method === "GET" && path === "/alerts/active") {
        return db.alerts.filter((a) => !a.acknowledged);
      }
      if (method === "POST" && path.startsWith("/alerts/") && path.endsWith("/ack")) {
        const id = path.split("/")[2];
        const found = db.alerts.find((a) => a.id === id);
        if (found) found.acknowledged = true;
        return { ok: true };
      }
      if (method === "POST" && path === "/reports/shift-handover") {
        const date = body?.dateIso || new Date().toISOString().slice(0, 10);
        const shift = body?.shift || "Day";
        const summary = shiftSummary({ dateIso: date, shift });
        return {
          ok: true,
          report: {
            id: uid("report"),
            generatedAt: new Date().toISOString(),
            dateIso: date,
            shift,
            lineId: summary.lineId,
            metrics: summary.metrics,
            output: summary.output,
            topLosses: summary.topLosses,
            notes: body?.notes || "",
            actionItems: [
              "Inspect infeed sensor alignment",
              "Review label applicator settings",
              "Confirm changeover checklist completion",
            ],
          },
        };
      }

      logger.warn("Mock backend: unknown route", method, path);
      return { ok: true };
    },
  };
}
