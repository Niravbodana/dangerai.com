import { createContext, useContext, useState, useCallback } from "react";

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [mode, setMode] = useState(null);

  const openLogin = useCallback(() => setMode("login"), []);
  const openSignup = useCallback(() => setMode("signup"), []);
  const close = useCallback(() => setMode(null), []);

  return (
    <AuthModalContext.Provider value={{ mode, openLogin, openSignup, close }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}
