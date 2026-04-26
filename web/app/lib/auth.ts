import { supabase } from "./supabase";

export const TOKEN_KEY = "mcp_jwt";
const USERNAME_KEY = "mcp_username";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
}

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function setUsername(username: string): void {
  localStorage.setItem(USERNAME_KEY, username);
}

/** Exchange a Supabase access token for our backend JWT and store it. */
export async function exchangeSupabaseToken(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/supabase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: accessToken }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    setToken(data.jwt);
    if (data.username) setUsername(data.username);
    return data.jwt;
  } catch {
    return null;
  }
}

/** Returns a valid backend JWT, re-exchanging via Supabase session if expired. */
export async function getFreshToken(): Promise<string | null> {
  const existing = getToken();
  if (existing) {
    try {
      const payload = JSON.parse(atob(existing.split(".")[1]));
      if (payload.exp * 1000 > Date.now() + 60_000) return existing;
    } catch {}
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  return exchangeSupabaseToken(session.access_token);
}

/** Fetch /auth/me — returns user profile or null. */
export async function fetchMe(): Promise<{ username: string; email: string; is_admin: boolean } | null> {
  const token = await getFreshToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
