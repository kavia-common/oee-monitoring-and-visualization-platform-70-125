import React, { useMemo } from "react";
import "../App.css";
import { getEnv } from "../config/env";
import { useAuth } from "../context/AuthContext";

// PUBLIC_INTERFACE
export function SettingsPage() {
  /** Settings + diagnostics. */
  const env = useMemo(() => getEnv(), []);
  const { user, setName, setLineId } = useAuth();

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">User</div>
            <div className="cardSub">Local profile for this demo</div>
          </div>
        </div>

        <div className="formRow">
          <div className="field">
            <label>Name</label>
            <input className="input" value={user.name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>Line ID</label>
            <input className="input" value={user.lineId} onChange={(e) => setLineId(e.target.value)} />
            <div className="helper">Used to filter dashboard and logging context.</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="cardHeader">
          <div>
            <div className="cardTitle">Environment</div>
            <div className="cardSub">Derived from REACT_APP_* variables</div>
          </div>
        </div>

        <table className="table" aria-label="Environment variables table">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>apiBase</td><td><code>{env.apiBase || "—"}</code></td></tr>
            <tr><td>backendUrl</td><td><code>{env.backendUrl || "—"}</code></td></tr>
            <tr><td>wsUrl</td><td><code>{env.wsUrl || "—"}</code></td></tr>
            <tr><td>nodeEnv</td><td><code>{env.nodeEnv}</code></td></tr>
            <tr><td>logLevel</td><td><code>{env.logLevel}</code></td></tr>
            <tr><td>healthcheckPath</td><td><code>{env.healthcheckPath}</code></td></tr>
            <tr><td>experimentsEnabled</td><td><code>{String(env.experimentsEnabled)}</code></td></tr>
            <tr>
              <td>featureFlags</td>
              <td><code>{Object.keys(env.featureFlags || {}).length ? JSON.stringify(env.featureFlags) : "—"}</code></td>
            </tr>
          </tbody>
        </table>

        <div className="helper" style={{ marginTop: 10 }}>
          If the backend is unreachable (healthcheck fails), the app automatically switches to mock mode.
        </div>
      </div>
    </div>
  );
}
