"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import { endpoints, unwrap } from "@/lib/api";

type ContextValue = {
  user: User | null; token: string | null; loading: boolean; unread: number;
  login: (email: string, password: string) => Promise<void>; googleLogin: (idToken: string) => Promise<void>; logout: () => void;
  updateUser: (updates: Partial<User>) => void; refreshUnread: () => Promise<void>; setUnreadCount: (count: number) => void;
};
const Context = createContext<ContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const logout = useCallback(() => {
    localStorage.removeItem("smartq_token"); localStorage.removeItem("smartq_user");
    setTokenState(null); setUser(null); setUnread(0); router.replace("/login");
  }, [router]);

  useEffect(() => {
    const savedToken = localStorage.getItem("smartq_token");
    const savedUser = localStorage.getItem("smartq_user");
    if (savedToken) setTokenState(savedToken);
    if (savedUser) try { setUser(JSON.parse(savedUser)); } catch { localStorage.removeItem("smartq_user"); }
    setLoading(false);
    window.addEventListener("smartq:unauthorized", logout);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    return () => window.removeEventListener("smartq:unauthorized", logout);
  }, [logout]);

  const establishSession = (response: any, fallbackEmail = "") => {
    const nextToken = response?.accessToken ?? response?.token;
    const source = response?.user ?? response?.customer;
    if (!nextToken || !source) throw new Error("The server did not return a valid account session.");
    const nextUser: User = { id: String(source._id ?? source.id), name: source.name ?? source.username ?? "Customer", email: source.email ?? fallbackEmail, phoneNumber: source.phoneNumber, profileImage: source.profileImage ?? source.profileImg };
    localStorage.setItem("smartq_token", nextToken); localStorage.setItem("smartq_user", JSON.stringify(nextUser));
    setTokenState(nextToken); setUser(nextUser);
  };
  const login = async (email: string, password: string) => establishSession(unwrap<any>(await endpoints.login({ email: email.trim().toLowerCase(), password })), email);
  const googleLogin = async (idToken: string) => establishSession(unwrap<any>(await endpoints.googleAuth(idToken)));
  const updateUser = (updates: Partial<User>) => setUser((current) => {
    if (!current) return current; const next = { ...current, ...updates }; localStorage.setItem("smartq_user", JSON.stringify(next)); return next;
  });
  const refreshUnread = useCallback(async () => {
    if (!token) return;
    try { const result = unwrap<{ count?: number }>(await endpoints.unreadNotificationCount()); setUnread(Math.max(0, Number(result?.count ?? 0))); } catch { /* optional */ }
  }, [token]);
  const setUnreadCount = useCallback((count: number) => setUnread(Math.max(0, count)), []);
  useEffect(() => { if (!token) return; void refreshUnread(); const timer = setInterval(refreshUnread, 15000); return () => clearInterval(timer); }, [refreshUnread, token]);
  const value = useMemo(() => ({ user, token, loading, unread, login, googleLogin, logout, updateUser, refreshUnread, setUnreadCount }), [user, token, loading, unread, logout, refreshUnread, setUnreadCount]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useApp = () => { const value = useContext(Context); if (!value) throw new Error("useApp must be inside AppProvider"); return value; };
