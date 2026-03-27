import React, { useState } from "react";
import { 
  Mail, Lock, Loader2, ArrowRight, 
  AlertCircle, Eye, EyeOff 
} from "lucide-react";
import type { NavigateProps } from "../../lib/types";
import { useAuth } from "../../hooks/useAuth";
// IMPORT YOUR LOGO PROPERLY (Adjust path as needed)
// import tipakLogo from "../../assets/tipak.png"; 
import "./AuthScreen.css";
type Mode = "login" | "register";
type Role = "resident" | "captain";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AuthScreen: React.FC<NavigateProps> = ({ navigate: _navigate }) => {
  const { login, register, authError, clearError } = useAuth();

  // Core state
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState<Role>("resident");
  
  // UX state
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
        await register(email, password, userType);
      }
      // Note: Auth state change automatically redirects via App.tsx ProtectedRoutes!
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
      {/* Background Decor */}
      <div className="auth__bg-orb auth__bg-orb--1" aria-hidden="true" />
      <div className="auth__bg-orb auth__bg-orb--2" aria-hidden="true" />

      <header className="auth__header">
        <div className="auth__logo">
          {/* Use the imported logo here instead of a hardcoded string */}
          <img src="/src/assets/tipak.png" alt="Project Tipak Logo" className="auth__logo-img" />
          <div className="auth__logo-text">Project Tipak</div>
        </div>
      </header>

      <main className="auth__body">
        <div className="auth__text-content">
          <h1 className="auth__headline">
            {mode === "login" ? "Mag-sign in" : "Gumawa ng account"}
          </h1>
          <p className="auth__subtext">
            {mode === "login"
              ? "Ipagpatuloy ang pag-assess ng iyong tahanan para sa kaligtasan."
              : "Sumali sa Project TIPAK para sa libreng AI structural assessment."}
          </p>
        </div>

        {/* Global Error Banner */}
        {authError && (
          <div className="auth__error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{authError}</span>
          </div>
        )}

        <form className="auth__form" onSubmit={handleSubmit} noValidate>
          {/* Email Field */}
          <div className="auth__input-group">
            <label htmlFor="email" className="auth__label">Email Address</label>
            <div className="auth__input-wrapper">
              <Mail className="auth__input-icon" size={20} />
              <input
                id="email"
                type="email"
                className={`auth__input ${fieldErrors.email ? "auth__input--error" : ""}`}
                placeholder="juan@halimbawa.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="auth__field-error">{fieldErrors.email}</span>}
          </div>

          {/* Password Field */}
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
                aria-label={showPassword ? "Itago ang password" : "Ipakita ang password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <span className="auth__field-error">{fieldErrors.password}</span>}
          </div>

          {/* Confirm Password (Register Only) */}
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

          {/* Login Extras (Remember Me & Forgot Password) */}
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
              <button type="button" className="auth__forgot-btn">
                Nakalimutan ang password?
              </button>
            </div>
          )}

          {/* Role Selector (Register Only) */}
          {mode === "register" && (
            <fieldset className="auth__user-type-toggle" disabled={isLoading}>
              <legend className="auth__label">Uri ng Account</legend>
              <div className="auth__user-type-options">
                {(["resident", "captain"] as const).map((role) => (
                  <label key={role} className={`auth__user-type-label ${userType === role ? "auth__user-type-label--active" : ""}`}>
                    <input
                      type="radio"
                      name="userType"
                      value={role}
                      checked={userType === role}
                      onChange={() => setUserType(role)}
                      className="auth__sr-only"
                    />
                    {role === "resident" ? "Residente" : "Kapitan"}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Submit Button */}
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
            {mode === "login" ? "Wala pang account?" : "May account ka na ba?"}
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