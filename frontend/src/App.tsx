// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import SubmissionScreen from "./screens/Submission/SubmissionScreen";
import Dashboard from "./screens/Dashboard/Dashboard";
import ResultScreen from "./screens/Result/ResultScreen";
import AuthScreen from "./screens/Authentication/AuthScreen";
import "leaflet/dist/leaflet.css";

// ─── Route Guards ────────────────────────────────────────────────────────────

// Forces unauthenticated users or non-captains away from the dashboard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (!isAuthenticated || userRole !== "captain") {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Forces authenticated captains away from public login to their home screen
const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (isAuthenticated && userRole === "captain") {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// ─── Router Setup ────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public Captain Auth Path */}
      <Route 
        path="/auth" 
        element={
          <AuthRedirect>
            <AuthScreen navigate={navigate} />
          </AuthRedirect>
        } 
      />

      {/* Root Path - Redirects to Submission as the default public landing */}
      <Route 
        path="/" 
        element={<Navigate to="/submission" replace />} 
      />

      {/* Public Paths for Residents */}
      <Route 
        path="/submission" 
        element={<SubmissionScreen navigate={navigate} />} 
      />
      
      <Route 
        path="/result" 
        element={<ResultScreen navigate={navigate} />} 
      />
      
      {/* Protected Captain Path */}
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard navigate={navigate} />
          </ProtectedRoute>
        } 
      />

      {/* Fallback for unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// ─── Root ────────────────────────────────────────────────────────────────────

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;