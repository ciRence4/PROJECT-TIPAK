import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import SubmissionScreen from "./screens/Submission/SubmissionScreen";
import Dashboard from "./screens/Dashboard/Dashboard";
import ResultScreen from "./screens/Result/ResultScreen";
import AuthScreen from "./screens/Authentication/AuthScreen";
import "leaflet/dist/leaflet.css";

// ─── Route Guards ────────────────────────────────────────────────────────────

// Forces unauthenticated users to the /auth screen
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Forces authenticated users away from public routes to their role's home screen
const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, userRole } = useAuth();
  
  if (isAuthenticated) {
    const home = userRole === "captain" ? "/dashboard" : "/submission";
    return <Navigate to={home} replace />;
  }
  
  return <>{children}</>;
};

// ─── Router Setup ────────────────────────────────────────────────────────────

const AppRoutes: React.FC = () => {
  // We grab navigate from react-router to pass down, keeping compatibility 
  // with your existing screen components that expect the `Maps` prop.
  const navigate = useNavigate();

  return (
    <Routes>
      {/* Public / Auth Path */}
      <Route 
        path="/auth" 
        element={
          <AuthRedirect>
            <AuthScreen navigate={navigate} />
          </AuthRedirect>
        } 
      />

      {/* Root Path - Redirects to Auth if not logged in, or home if logged in */}
      <Route 
        path="/" 
        element={
          <AuthRedirect>
            <Navigate to="/auth" replace />
          </AuthRedirect>
        } 
      />

      {/* Protected Paths */}
      <Route 
        path="/submission" 
        element={
          <ProtectedRoute>
            <SubmissionScreen navigate={navigate} />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/result" 
        element={
          <ProtectedRoute>
            <ResultScreen navigate={navigate} />
          </ProtectedRoute>
        } 
      />
      
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