import { getEnv } from "../config/env";

const levelRank = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

function shouldLog(level) {
  const { logLevel } = getEnv();
  const min = levelRank[(logLevel || "info").toLowerCase()] ?? levelRank.info;
  return (levelRank[level] ?? 100) >= min;
}

// PUBLIC_INTERFACE
export const logger = {
  /** Minimal logger with log level from REACT_APP_LOG_LEVEL. */
  debug: (...args) => shouldLog("debug") && console.debug("[debug]", ...args),
  info: (...args) => shouldLog("info") && console.info("[info]", ...args),
  warn: (...args) => shouldLog("warn") && console.warn("[warn]", ...args),
  error: (...args) => shouldLog("error") && console.error("[error]", ...args),
};
