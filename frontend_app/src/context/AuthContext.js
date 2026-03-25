import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

const ROLES = {
  OPERATOR: "Operator",
  SUPERVISOR: "Shift Supervisor",
  MANAGER: "Plant Manager",
};

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides a simple local "auth" context for role-based UI. */
  const [user, setUser] = useState(() => ({
    name: "Alex",
    role: ROLES.OPERATOR,
    lineId: "LINE_A",
  }));

  const value = useMemo(
    () => ({
      user,
      roles: ROLES,
      setRole: (role) => setUser((u) => ({ ...u, role })),
      setName: (name) => setUser((u) => ({ ...u, name })),
      setLineId: (lineId) => setUser((u) => ({ ...u, lineId })),
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// PUBLIC_INTERFACE
export function useAuth() {
  /** Hook to access current user and role. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function canAccess(userRole, capability) {
  /** Simple capability mapping for role-based UI. */
  const map = {
    viewDashboards: [ROLES.OPERATOR, ROLES.SUPERVISOR, ROLES.MANAGER],
    logProduction: [ROLES.OPERATOR, ROLES.SUPERVISOR],
    logDowntime: [ROLES.OPERATOR, ROLES.SUPERVISOR],
    logQuality: [ROLES.OPERATOR, ROLES.SUPERVISOR],
    viewShiftAnalysis: [ROLES.SUPERVISOR, ROLES.MANAGER],
    viewManagerOverview: [ROLES.MANAGER],
    generateHandover: [ROLES.SUPERVISOR, ROLES.MANAGER],
    manageAlerts: [ROLES.SUPERVISOR, ROLES.MANAGER],
  };

  const allowed = map[capability] || [];
  return allowed.includes(userRole);
}
