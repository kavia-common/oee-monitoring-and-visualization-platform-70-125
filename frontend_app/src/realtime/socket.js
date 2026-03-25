import { io } from "socket.io-client";
import { getEnv } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Real-time client for OEE updates.
 * If WS is unavailable, we fall back to a timer-based mock stream so the UI stays live.
 */

function createMockStream() {
  const listeners = new Map();
  let timer = null;

  function emit(event, payload) {
    const ls = listeners.get(event) || [];
    ls.forEach((cb) => cb(payload));
  }

  function start() {
    if (timer) return;
    timer = setInterval(() => {
      // Small payloads; the API client will refresh the actual panels.
      emit("oee:update", { lineId: "LINE_A", at: new Date().toISOString() });
      if (Math.random() < 0.12) {
        emit("alert:new", {
          id: `mock_${Date.now()}`,
          severity: "info",
          title: "Heads-up",
          message: "Mock realtime signal (backend offline).",
          createdAt: new Date().toISOString(),
        });
      }
    }, 3000);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return {
    isMock: true,
    connect: start,
    disconnect: stop,
    on(event, cb) {
      const arr = listeners.get(event) || [];
      listeners.set(event, [...arr, cb]);
      return () => listeners.set(event, (listeners.get(event) || []).filter((x) => x !== cb));
    },
  };
}

// PUBLIC_INTERFACE
export function createRealtimeClient() {
  /** Creates a realtime client; uses REACT_APP_WS_URL, otherwise falls back to REACT_APP_BACKEND_URL. */
  const env = getEnv();
  const url = env.wsUrl || env.backendUrl;
  if (!url) return createMockStream();

  try {
    const socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: false,
    });

    return {
      isMock: false,
      connect() {
        socket.connect();
      },
      disconnect() {
        socket.disconnect();
      },
      on(event, cb) {
        socket.on(event, cb);
        return () => socket.off(event, cb);
      },
      onStatus(cb) {
        const onConnect = () => cb({ connected: true });
        const onDisconnect = (reason) => cb({ connected: false, reason });
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("connect_error", (err) => {
          logger.warn("Socket connect_error; switching to mock stream.", err?.message || err);
          cb({ connected: false, reason: "connect_error" });
        });
        return () => {
          socket.off("connect", onConnect);
          socket.off("disconnect", onDisconnect);
        };
      },
    };
  } catch (e) {
    logger.warn("Realtime init failed; using mock stream.", e);
    return createMockStream();
  }
}
