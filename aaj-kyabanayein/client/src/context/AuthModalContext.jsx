import { createContext, useContext, useState, useCallback } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [mode, setMode] = useState(null);
  const [signupReason, setSignupReason] = useState(null);

  const openLogin = useCallback((reason = null) => {
    setSignupReason(reason);
    setMode("login");
  }, []);

  const openSignup = useCallback((reason = null) => {
    setSignupReason(reason);
    setMode("signup");
  }, []);

  const close = useCallback(() => {
    setMode(null);
    setSignupReason(null);
  }, []);

  return (
    <AuthModalContext.Provider value={{ mode, signupReason, openLogin, openSignup, close }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
