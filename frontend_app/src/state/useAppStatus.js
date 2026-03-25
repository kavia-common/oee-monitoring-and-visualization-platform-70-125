import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createApiClient } from "../api/client";
import { createRealtimeClient } from "../realtime/socket";
import { logger } from "../utils/logger";

const StatusContext = createContext(null);

// PUBLIC_INTERFACE
export function AppStatusProvider({ children }) {
  /** Provides API client, realtime client, and connectivity/mock state. */
  const [api] = useState(() => createApiClient());
  const [rt] = useState(() => createRealtimeClient());

  const [apiMockMode, setApiMockMode] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const mockMode = await api.isMockMode();
        if (!cancelled) setApiMockMode(mockMode);
      } catch (e) {
        logger.warn("api.isMockMode check failed", e);
        if (!cancelled) setApiMockMode(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    rt.connect();
    let off = null;

    if (rt.onStatus) {
      off = rt.onStatus((st) => setRealtimeConnected(Boolean(st.connected)));
    } else {
      // mock client - consider connected
      setRealtimeConnected(true);
    }

    return () => {
      off?.();
      rt.disconnect();
    };
  }, [rt]);

  const value = useMemo(() => ({ api, rt, apiMockMode, realtimeConnected }), [api, rt, apiMockMode, realtimeConnected]);

  return <StatusContext.Provider value={value}>{children}</StatusContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAppStatus() {
  /** Hook to access API/realtime clients and connectivity state. */
  const ctx = useContext(StatusContext);
  if (!ctx) throw new Error("useAppStatus must be used within AppStatusProvider");
  return ctx;
}
