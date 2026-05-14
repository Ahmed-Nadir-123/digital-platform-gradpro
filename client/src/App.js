import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/layout/Home";
import TrackRequest from "./components/shared/TrackRequest";
import AuthPage from "./components/auth/AuthPage";
import DigitalRequests from "./components/employee/DigitalRequests";
import { LanguageProvider } from "./lib/LanguageContext";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <LanguageProvider>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Router>
        <Routes>
          {/* Login Page */}
          <Route path="/" element={<AuthPage />} />

          {/* Dashboard (now Home) */}
          <Route path="/dashboard" element={<Home />} />

          {/* Other pages */}
          <Route path="/track-request" element={<TrackRequest />} />

          <Route path="/digital-requests" element={<DigitalRequests />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
