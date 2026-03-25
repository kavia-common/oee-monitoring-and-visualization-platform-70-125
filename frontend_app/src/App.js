import React from "react";
import "./App.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AlertProvider } from "./context/AlertContext";
import { AppStatusProvider } from "./state/useAppStatus";
import { AppRouter } from "./routes/AppRouter";
import { AlertStack } from "./components/AlertStack";

/**
 * Application entry component (UI shell + routing + providers).
 */

// PUBLIC_INTERFACE
function App() {
  /** Root React component that mounts providers and the app router. */
  return (
    <AuthProvider>
      <AlertProvider>
        <AppStatusProvider>
          <BrowserRouter>
            <AppRouter />
            <AlertStack />
          </BrowserRouter>
        </AppStatusProvider>
      </AlertProvider>
    </AuthProvider>
  );
}

export default App;
