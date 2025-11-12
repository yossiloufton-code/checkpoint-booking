import React, {
  createContext,
  useEffect,
  useState,
  type ReactNode,
  useCallback,
  useMemo,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  fetchMe,
  loginGuest,
  type User,
  type AuthResponse,
} from "../api/auth";
import { apiClient } from "../api/client";

type Role = "GUEST" | "MEMBER";

interface AuthContextValue {
  user: User | null;
  loading: boolean;

  // derived helpers
  isAuthenticated: boolean;   // ✅ new
  isGuest: boolean;
  isMember: boolean;
  roleLabel: "Guest" | "Member" | "Unknown";

  // actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: Role) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function setAuthHeader(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem("accessToken", token);
  } else {
    delete apiClient.defaults.headers.common.Authorization;
    localStorage.removeItem("accessToken");
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    setAuthHeader(token);

    (async () => {
      try {
        const me = await fetchMe();
        setUser(me);
      } catch {
        setAuthHeader(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "accessToken") {
        const token = localStorage.getItem("accessToken");
        setAuthHeader(token);
        if (!token) {
          setUser(null);
        } else {
          fetchMe()
            .then(setUser)
            .catch(() => {
              setAuthHeader(null);
              setUser(null);
            });
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleAuth = useCallback((data: AuthResponse) => {
    setAuthHeader(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiLogin(email, password);
      handleAuth(res);
    },
    [handleAuth]
  );

  const register = useCallback(
    async (name: string, email: string, password: string, role: Role) => {
      const res = await apiRegister(name, email, password, role);
      handleAuth(res);
    },
    [handleAuth]
  );

  const loginAsGuest = useCallback(async () => {
    const res = await loginGuest();
    handleAuth(res);
  }, [handleAuth]);

  const logout = useCallback(() => {
    setAuthHeader(null);
    setUser(null);
  }, []);

  // derived helpers
  const isAuthenticated = !!user;              // ✅ new
  const isGuest = user?.role === "GUEST";
  const isMember = user?.role === "MEMBER";
  const roleLabel = isMember ? "Member" : isGuest ? "Guest" : "Unknown";

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated,   // ✅ include it
      isGuest,
      isMember,
      roleLabel,
      login,
      register,
      loginAsGuest,
      logout,
    }),
    [user, loading, isAuthenticated, isGuest, isMember, roleLabel, login, register, loginAsGuest, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
