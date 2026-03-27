// src/screens/Authentication/AuthScreen.tsx
import React, { useState } from "react";
import { 
  Mail, Lock, Loader2, ArrowRight, 
  AlertCircle, Eye, EyeOff
} from "lucide-react";
import type { NavigateProps } from "../../lib/types";
import { useAuth } from "../../hooks/useAuth";
import "./AuthScreen.css";

type Mode = "login" | "register";

const AuthScreen: React.FC<NavigateProps> = ({ navigate }) => {
  const { login, register, authError, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) errors.email = "Kinakailangan ang email address.";
    else if (!emailRegex.test(email)) errors.email = "Mali ang format ng email.";

    if (!password) errors.password = "Kinakailangan ang password.";
    else if (password.length < 6) errors.password = "Dapat ay hindi bababa sa 6 na karakter.";

    if (mode === "register") {
      if (!confirmPassword) errors.confirmPassword = "Pakikumpirma ang iyong password.";
      else if (password !== confirmPassword) errors.confirmPassword = "Hindi tugma ang mga password.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, "captain"); 
      }
      
      navigate("/dashboard");
      
    } catch (err) {
      console.error("Authentication failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword("");
    setConfirmPassword("");
    setFieldErrors({});
    clearError();
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="auth">
      <div className="auth__bg-orb auth__bg-orb--1" aria-hidden="true" />
      <div className="auth__bg-orb auth__bg-orb--2" aria-hidden="true" />

      <header className="auth__header">
        <div className="auth__logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <img src="/src/assets/tipak.png" alt="Project Tipak Logo" className="auth__logo-img" />
          <div className="auth__logo-text">Project Tipak</div>
        </div>
      </header>

      <main className="auth__body">
        <div className="auth__text-content">
          <h1 className="auth__headline">
            Captain Portal
          </h1>
          <p className="auth__subtext">
            {mode === "login"
              ? "Mag-sign in upang pamahalaan ang mga ulat ng inyong barangay."
              : "Mag-rehistro ng bagong Captain account."}
          </p>
        </div>

        {authError && (
          <div className="auth__error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{authError}</span>
          </div>
        )}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          <div className="auth__input-group">
            <label htmlFor="email" className="auth__label">Email Address</label>
            <div className="auth__input-wrapper">
              <Mail className="auth__input-icon" size={20} />
              <input
                id="email"
                type="email"
                className={`auth__input ${fieldErrors.email ? "auth__input--error" : ""}`}
                placeholder="kapitan@barangay.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="auth__field-error">{fieldErrors.email}</span>}
          </div>

          <div className="auth__input-group">
            <label htmlFor="password" className="auth__label">Password</label>
            <div className="auth__input-wrapper">
              <Lock className="auth__input-icon" size={20} />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={`auth__input ${fieldErrors.password ? "auth__input--error" : ""}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                disabled={isLoading}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
              <button 
                type="button" 
                className="auth__toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <span className="auth__field-error">{fieldErrors.password}</span>}
          </div>

          {mode === "register" && (
            <div className="auth__input-group">
              <label htmlFor="confirmPassword" className="auth__label">Kumpirmahin ang Password</label>
              <div className="auth__input-wrapper">
                <Lock className="auth__input-icon" size={20} />
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  className={`auth__input ${fieldErrors.confirmPassword ? "auth__input--error" : ""}`}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError("confirmPassword"); }}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              {fieldErrors.confirmPassword && <span className="auth__field-error">{fieldErrors.confirmPassword}</span>}
            </div>
          )}

          {mode === "login" && (
            <div className="auth__form-extras">
              <label className="auth__checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="auth__checkbox-text">Tandaan ako</span>
              </label>
            </div>
          )}

          <button type="submit" className="auth__btn auth__btn--primary" disabled={isLoading}>
            {isLoading ? (
              <Loader2 size={20} className="auth__icon-spin" />
            ) : (
              <>
                {mode === "login" ? "Mag-sign in" : "Gumawa ng Account"}
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>

        <div className="auth__footer">
          <p className="auth__toggle-text">
            {mode === "login" ? "Walang Captain account?" : "May account ka na ba?"}
          </p>
          <button
            type="button"
            className="auth__btn auth__btn--text"
            onClick={() => switchMode(mode === "login" ? "register" : "login")}
            disabled={isLoading}
          >
            {mode === "login" ? "Mag-register dito" : "Mag-sign in dito"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AuthScreen;