import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type KitchenUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  phoneVerified: boolean;
  role: "customer" | "admin";
  emailVerified: boolean;
  emailVerificationRequired: boolean;
};

type AuthContextValue = {
  user: KitchenUser | null;
  loading: boolean;
  refresh: () => Promise<KitchenUser | null>;
  register: (input: { name: string; email: string; phone: string; password: string; password_confirmation: string }) => Promise<KitchenUser>;
  login: (input: { identifier: string; password: string }) => Promise<KitchenUser>;
  logout: () => Promise<void>;
  resendVerification: () => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (input: { email: string; password: string; password_confirmation: string; token: string }) => Promise<string>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const cookie = (name: string) => document.cookie.split("; ").find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
const csrfToken = () => { const value = cookie("XSRF-TOKEN"); try { return value ? decodeURIComponent(value) : undefined; } catch { return undefined; } };
let sessionCsrfToken: string | undefined;
const refreshCsrf = async () => { const response = await fetch("/api/auth/csrf", { credentials: "same-origin", cache: "no-store" }); const data = await response.json().catch(() => ({})) as { token?: string }; sessionCsrfToken = data.token; return response; };

export async function laravelRequest<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const mutation = method !== "GET";
  if (mutation) await refreshCsrf();
  const send = () => { const headers: Record<string, string> = { Accept: "application/json" }; if (body !== undefined) headers["Content-Type"] = "application/json"; const token = sessionCsrfToken; if (token) headers["X-CSRF-TOKEN"] = token; const encryptedToken = csrfToken(); if (encryptedToken) headers["X-XSRF-TOKEN"] = encryptedToken; return fetch(`/api${path}`, { method, headers, credentials: "same-origin", body: body === undefined ? undefined : JSON.stringify(body) }); };
  let response = await send();
  if (mutation && response.status === 419) { await refreshCsrf(); response = await send(); }
  const data = await response.json().catch(() => ({})) as T & { message?: string; errors?: Record<string, string[]> };
  if (!response.ok) throw new Error(data.message ?? Object.values(data.errors ?? {}).flat().join(" ") ?? "Something went wrong.");
  return data;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<KitchenUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refresh = async () => {
    const data = await laravelRequest<{ user: KitchenUser | null }>("/auth/me");
    setUser(data.user);
    return data.user;
  };
  useEffect(() => { void refresh().catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user, loading, refresh,
    register: async (input) => { const data = await laravelRequest<{ user: KitchenUser }>("/auth/register", "POST", input); setUser(data.user); return data.user; },
    login: async (input) => { const data = await laravelRequest<{ user: KitchenUser }>("/auth/login", "POST", input); setUser(data.user); return data.user; },
    logout: async () => { await laravelRequest("/auth/logout", "POST"); setUser(null); },
    resendVerification: async () => (await laravelRequest<{ message: string }>("/auth/verification/resend", "POST")).message,
    forgotPassword: async (email) => (await laravelRequest<{ message: string }>("/auth/password/forgot", "POST", { email })).message,
    resetPassword: async (input) => (await laravelRequest<{ message: string }>("/auth/password/reset", "POST", input)).message,
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
