import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../lib/api";
import type { UserRole } from "../lib/types";

interface AuthState {
  isAuthenticated: boolean;
  userRole: UserRole | null;
  userId: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  authError: string | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, role: UserRole) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({ 
    isAuthenticated: false, 
    userRole: null,
    userId: null,
    isLoading: true 
  });
  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize session from LocalStorage
  useEffect(() => {
    const token = localStorage.getItem("tipak_jwt_token");
    const role = localStorage.getItem("tipak_user_role") as UserRole | null;
    const userId = localStorage.getItem("tipak_user_id");

    if (token && role && userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAuthState({ isAuthenticated: true, userRole: role, userId, isLoading: false });
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setAuthError(null);
    try {
      const { token, role, userId } = await api.login(email, pass);
      
      // Store session data
      localStorage.setItem("tipak_jwt_token", token);
      localStorage.setItem("tipak_user_role", role);
      localStorage.setItem("tipak_user_id", userId);

      setAuthState({ isAuthenticated: true, userRole: role, userId, isLoading: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setAuthError(err.message || "Failed to log in.");
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, pass: string, userRole: UserRole) => {
    setAuthError(null);
    try {
      const { token, role, userId } = await api.register(email, pass, userRole);
      
      // Store session data
      localStorage.setItem("tipak_jwt_token", token);
      localStorage.setItem("tipak_user_role", role);
      localStorage.setItem("tipak_user_id", userId);

      setAuthState({ isAuthenticated: true, userRole: role, userId, isLoading: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setAuthError(err.message || "Failed to register account.");
      throw err;
    }
  }, []);

  const logout = useCallback(() => {
    // Clear session data
    localStorage.removeItem("tipak_jwt_token");
    localStorage.removeItem("tipak_user_role");
    localStorage.removeItem("tipak_user_id");

    setAuthState({ isAuthenticated: false, userRole: null, userId: null, isLoading: false });
    setAuthError(null);
  }, []);

  const clearError = useCallback(() => setAuthError(null), []);

  const value = useMemo(() => ({
    ...authState, authError, login, register, logout, clearError
  }), [authState, authError, login, register, logout, clearError]);

  if (authState.isLoading) return null; 

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};