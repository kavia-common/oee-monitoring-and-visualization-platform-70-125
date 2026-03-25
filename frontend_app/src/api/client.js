import { getEnv } from "../config/env";
import { logger } from "../utils/logger";
import { createMockBackend } from "./mockBackend";

/**
 * Simple fetch wrapper with:
 * - base URL from env
 * - JSON request/response helpers
 * - healthcheck detection and fallback to mock backend when unavailable
 */

const mock = createMockBackend();

async function safeJson(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// PUBLIC_INTERFACE
export function createApiClient() {
  /** Creates an API client instance used by the app. */
  const env = getEnv();
  const base = env.apiBase || "";
  let backendHealthy = null; // null unknown, true/false known
  let lastHealthAt = 0;

  async function checkHealth() {
    const now = Date.now();
    if (backendHealthy !== null && now - lastHealthAt < 10_000) return backendHealthy;

    lastHealthAt = now;

    if (!base) {
      backendHealthy = false;
      return backendHealthy;
    }

    try {
      const url = `${base}${env.healthcheckPath.startsWith("/") ? "" : "/"}${env.healthcheckPath}`;
      const res = await fetch(url, { method: "GET" });
      backendHealthy = res.ok;
      return backendHealthy;
    } catch (e) {
      backendHealthy = false;
      return backendHealthy;
    }
  }

  async function request(path, { method = "GET", body, headers = {} } = {}) {
    const healthy = await checkHealth();
    if (!healthy) {
      logger.warn("Backend unavailable; using mock mode for request:", method, path);
      return mock.request(path, { method, body });
    }

    const url = `${base}${path.startsWith("/") ? "" : "/"}${path}`;
    const init = { method, headers: { ...headers } };

    if (body !== undefined) {
      init.headers["Content-Type"] = init.headers["Content-Type"] || "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const res = await fetch(url, init);
    const data = await safeJson(res);
    if (!res.ok) {
      const msg = (data && data.message) || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  return {
    // PUBLIC_INTERFACE
    async getOverview({ startIso, endIso, lineId }) {
      /** Get OEE overview metrics and spark series. */
      const qs = new URLSearchParams();
      if (startIso) qs.set("start", startIso);
      if (endIso) qs.set("end", endIso);
      if (lineId) qs.set("lineId", lineId);
      const suffix = qs.toString() ? `?${qs}` : "";
      return request(`/oee/overview${suffix}`);
    },

    // PUBLIC_INTERFACE
    async getShiftSummary({ dateIso, shift }) {
      /** Get shift-level summary. */
      const qs = new URLSearchParams();
      if (dateIso) qs.set("date", dateIso);
      if (shift) qs.set("shift", shift);
      const suffix = qs.toString() ? `?${qs}` : "";
      return request(`/shifts/summary${suffix}`);
    },

    // PUBLIC_INTERFACE
    async getShiftComparison({ dateIso, shiftA, shiftB }) {
      /** Compare two shifts. */
      const qs = new URLSearchParams();
      if (dateIso) qs.set("date", dateIso);
      if (shiftA) qs.set("shiftA", shiftA);
      if (shiftB) qs.set("shiftB", shiftB);
      const suffix = qs.toString() ? `?${qs}` : "";
      return request(`/shifts/compare${suffix}`);
    },

    // PUBLIC_INTERFACE
    async listEvents({ limit = 50 }) {
      /** List latest downtime/quality/production events. */
      const qs = new URLSearchParams();
      qs.set("limit", String(limit));
      return request(`/events?${qs.toString()}`);
    },

    // PUBLIC_INTERFACE
    async createProductionRun(payload) {
      /** Create a production run log entry. */
      return request(`/logs/production-runs`, { method: "POST", body: payload });
    },

    // PUBLIC_INTERFACE
    async createDowntime(payload) {
      /** Create a downtime event log entry. */
      return request(`/logs/downtime`, { method: "POST", body: payload });
    },

    // PUBLIC_INTERFACE
    async createQualityEvent(payload) {
      /** Create a quality event log entry. */
      return request(`/logs/quality`, { method: "POST", body: payload });
    },

    // PUBLIC_INTERFACE
    async getAlerts() {
      /** Get active alerts. */
      return request(`/alerts/active`);
    },

    // PUBLIC_INTERFACE
    async acknowledgeAlert(alertId) {
      /** Acknowledge a specific alert. */
      return request(`/alerts/${encodeURIComponent(alertId)}/ack`, { method: "POST" });
    },

    // PUBLIC_INTERFACE
    async generateShiftHandoverReport({ dateIso, shift, notes }) {
      /** Generate a shift handover report for printing/export. */
      return request(`/reports/shift-handover`, { method: "POST", body: { dateIso, shift, notes } });
    },

    // PUBLIC_INTERFACE
    async isMockMode() {
      /** Returns true if the backend is currently considered unhealthy. */
      const healthy = await checkHealth();
      return !healthy;
    },
  };
}
