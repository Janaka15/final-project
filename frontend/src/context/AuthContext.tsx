import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "@/services/api";

interface User {
  id: number;
  email: string;
  name: string;
  role: "ADMIN" | "CUSTOMER";
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      authApi
        .me()
        .then((res) => setUser(res.data))
        .catch(() => {
          setToken(null);
          localStorage.removeItem("token");
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    const me = await authApi.me();
    setUser(me.data);
  };

  const register = async (email: string, name: string, password: string) => {
    const res = await authApi.register({ email, name, password });
    const { access_token } = res.data;
    localStorage.setItem("token", access_token);
    setToken(access_token);
    const me = await authApi.me();
    setUser(me.data);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAdmin: user?.role === "ADMIN",
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
