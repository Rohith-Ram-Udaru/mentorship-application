import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../services/mentorflow";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("mentorflow_token")));

  useEffect(() => {
    const token = localStorage.getItem("mentorflow_token");
    if (!token) return;
    authApi
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem("mentorflow_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(payload) {
    const data = await authApi.login(payload);
    localStorage.setItem("mentorflow_token", data.token);
    setUser(data.user);
    return data;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    localStorage.setItem("mentorflow_token", data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem("mentorflow_token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
