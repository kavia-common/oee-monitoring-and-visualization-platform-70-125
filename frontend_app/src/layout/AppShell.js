import React, { useMemo } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import "../App.css";
import { canAccess, useAuth } from "../context/AuthContext";
import { useAppStatus } from "../state/useAppStatus";

function titleForPath(pathname) {
  if (pathname.startsWith("/operator")) return "Operator Console";
  if (pathname.startsWith("/dashboards")) return "OEE Dashboards";
  if (pathname.startsWith("/alerts")) return "Alerts";
  if (pathname.startsWith("/shift-analysis")) return "Shift Analysis";
  if (pathname.startsWith("/handover")) return "Shift Handover Report";
  if (pathname.startsWith("/settings")) return "Settings";
  return "OEE Platform";
}

function icon(txt) {
  return <div className="navIcon" aria-hidden="true">{txt}</div>;
}

// PUBLIC_INTERFACE
export function AppShell() {
  /** Main application layout with sidebar navigation and top header. */
  const { user, roles, setRole } = useAuth();
  const location = useLocation();
  const { realtimeConnected, apiMockMode } = useAppStatus();

  const navItems = useMemo(() => {
    const items = [
      { to: "/dashboards/live", label: "Live Dashboard", icon: "📈", cap: "viewDashboards" },
      { to: "/operator/logs", label: "Logging", icon: "✍️", cap: "logProduction" },
      { to: "/alerts", label: "Alerts", icon: "🔔", cap: "manageAlerts" },
      { to: "/shift-analysis", label: "Shift Compare", icon: "🧭", cap: "viewShiftAnalysis" },
      { to: "/handover", label: "Handover Report", icon: "🗒️", cap: "generateHandover" },
      { to: "/settings", label: "Settings", icon: "⚙️", cap: "viewDashboards" },
    ];
    return items.filter((i) => canAccess(user.role, i.cap));
  }, [user.role]);

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark" />
          <div className="brandTitle">
            <strong>OEE Monitor</strong>
            <span>Ocean Professional</span>
          </div>
        </div>

        <div className="navGroupLabel">Navigate</div>
        <nav className="nav" aria-label="Sidebar navigation">
          {navItems.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              className={({ isActive }) => `navItem ${isActive ? "navItemActive" : ""}`}
            >
              {icon(i.icon)}
              <div style={{ fontWeight: 800 }}>{i.label}</div>
            </NavLink>
          ))}
        </nav>

        <div className="navGroupLabel">Role</div>
        <div className="nav">
          <select
            className="select"
            value={user.role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Select role"
          >
            <option value={roles.OPERATOR}>{roles.OPERATOR}</option>
            <option value={roles.SUPERVISOR}>{roles.SUPERVISOR}</option>
            <option value={roles.MANAGER}>{roles.MANAGER}</option>
          </select>
          <div className="helper">
            Demo role-switching controls what you can see and do.
          </div>
        </div>

        <div className="sidebarFooter">
          <div>Line: <strong>{user.lineId}</strong></div>
          <div style={{ marginTop: 6, opacity: 0.9 }}>
            Data: <strong>{apiMockMode ? "Mock" : "Live"}</strong> • Realtime:{" "}
            <strong>{realtimeConnected ? "Connected" : "Offline"}</strong>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div className="headerLeft">
            <div className="headerTitle">{titleForPath(location.pathname)}</div>
            <div className="headerSubtitle">
              {user.name} • {user.role}
            </div>
          </div>

          <div className="headerRight">
            <div className="pill" title="API mode">
              <span className={`pillDot ${apiMockMode ? "pillDotBad" : "pillDotOk"}`} />
              API: {apiMockMode ? "Mock Mode" : "Backend"}
            </div>
            <div className="pill" title="Realtime">
              <span className={`pillDot ${realtimeConnected ? "pillDotOk" : "pillDotBad"}`} />
              Realtime: {realtimeConnected ? "On" : "Off"}
            </div>
          </div>
        </header>

        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
