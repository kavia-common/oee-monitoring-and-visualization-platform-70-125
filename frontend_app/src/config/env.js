/**
 * Central place to read and interpret REACT_APP_* environment variables.
 * CRA only exposes env vars prefixed with REACT_APP_.
 */

// PUBLIC_INTERFACE
export function getEnv() {
  /** Returns a normalized configuration object derived from REACT_APP_* env vars. */
  const apiBase = process.env.REACT_APP_API_BASE || "";
  const backendUrl = process.env.REACT_APP_BACKEND_URL || "";
  const frontendUrl = process.env.REACT_APP_FRONTEND_URL || "";
  const wsUrl = process.env.REACT_APP_WS_URL || "";
  const nodeEnv = process.env.REACT_APP_NODE_ENV || process.env.NODE_ENV || "development";
  const logLevel = process.env.REACT_APP_LOG_LEVEL || "info";
  const healthcheckPath = process.env.REACT_APP_HEALTHCHECK_PATH || "/health";
  const featureFlagsRaw = process.env.REACT_APP_FEATURE_FLAGS || "";
  const experimentsEnabled = (process.env.REACT_APP_EXPERIMENTS_ENABLED || "false").toLowerCase() === "true";

  const featureFlags = parseCsvFlags(featureFlagsRaw);

  // Prefer explicit API base; otherwise attempt to infer from backendUrl.
  const resolvedApiBase = apiBase || backendUrl;

  return {
    apiBase: stripTrailingSlash(resolvedApiBase),
    backendUrl: stripTrailingSlash(backendUrl),
    frontendUrl: stripTrailingSlash(frontendUrl),
    wsUrl: stripTrailingSlash(wsUrl),
    nodeEnv,
    logLevel,
    healthcheckPath,
    featureFlags,
    experimentsEnabled,
  };
}

// PUBLIC_INTERFACE
export function hasFeature(flagName) {
  /** Returns true if a named feature flag is enabled in REACT_APP_FEATURE_FLAGS. */
  const { featureFlags } = getEnv();
  return Boolean(featureFlags[flagName]);
}

function stripTrailingSlash(v) {
  if (!v) return "";
  return v.endsWith("/") ? v.slice(0, -1) : v;
}

function parseCsvFlags(raw) {
  // Accept "a,b,c" and "a=true,b=false" formats.
  const out = {};
  raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((token) => {
      const [k, v] = token.split("=").map((x) => (x || "").trim());
      if (!k) return;
      if (typeof v === "string" && v.length) {
        out[k] = ["1", "true", "yes", "on"].includes(v.toLowerCase());
      } else {
        out[k] = true;
      }
    });
  return out;
}
