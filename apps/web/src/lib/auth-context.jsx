"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, loginUser as apiLogin, registerUser as apiRegister } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchMe();
      setUser(data.user);
      if (data.user?.theme) {
        const savedTheme = localStorage.getItem("app_theme");
        if (!savedTheme || savedTheme !== data.user.theme) {
          localStorage.setItem("app_theme", data.user.theme);
          window.dispatchEvent(new CustomEvent("theme-changed", { detail: data.user.theme }));
        }
      }
    } catch {
      localStorage.removeItem("token");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async ({ email, username, password }) => {
    const data = await apiLogin({ email, username, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    router.push("/dashboard");
  };

  const register = async ({ name, username, email, studentId, password, role }) => {
    const data = await apiRegister({ name, username, email, studentId, password, role });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    router.push("/dashboard");
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
