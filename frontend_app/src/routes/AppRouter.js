import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../layout/AppShell";
import { DashboardLive } from "../pages/DashboardLive";
import { OperatorLogs } from "../pages/OperatorLogs";
import { AlertsPage } from "../pages/AlertsPage";
import { ShiftAnalysis } from "../pages/ShiftAnalysis";
import { HandoverReport } from "../pages/HandoverReport";
import { SettingsPage } from "../pages/SettingsPage";
import { NotFound } from "../pages/NotFound";

// PUBLIC_INTERFACE
export function AppRouter() {
  /** Top-level router definition. */
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboards/live" replace />} />
        <Route path="dashboards">
          <Route path="live" element={<DashboardLive />} />
        </Route>
        <Route path="operator">
          <Route path="logs" element={<OperatorLogs />} />
        </Route>
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="shift-analysis" element={<ShiftAnalysis />} />
        <Route path="handover" element={<HandoverReport />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
