import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchMe, getToken, login as apiLogin, loginWithGoogle as apiGoogleLogin, register as apiRegister } from "../api";
import { getGuestId, getLocalFavorites, setLocalFavorites } from "../lib/guest";

const AuthContext = createContext(null);

function guestMergePayload() {
  return {
    guestId: getGuestId(),
    favoriteIds: getLocalFavorites(),
  };
}

function applyMergedFavorites(mergedFavorites) {
  if (Array.isArray(mergedFavorites) && mergedFavorites.length) {
    setLocalFavorites(mergedFavorites);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const data = await fetchMe();
      setUser(data.user);
    } catch {
      localStorage.removeItem("akb-token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const data = await apiLogin(email, password, guestMergePayload());
    localStorage.setItem("akb-token", data.token);
    applyMergedFavorites(data.mergedFavorites);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await apiRegister(name, email, password, guestMergePayload());
    localStorage.setItem("akb-token", data.token);
    applyMergedFavorites(data.mergedFavorites);
    setUser(data.user);
    return data;
  };

  const loginWithGoogle = async (credential) => {
    const data = await apiGoogleLogin(credential, guestMergePayload());
    localStorage.setItem("akb-token", data.token);
    applyMergedFavorites(data.mergedFavorites);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("akb-token");
    localStorage.removeItem("akb-prefs");
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
