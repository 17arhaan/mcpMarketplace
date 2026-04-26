"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { clearToken, exchangeSupabaseToken, fetchMe, getUsername } from "../lib/auth";

export function NavAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  async function resolveUser(session: { access_token: string } | null) {
    if (!session) { setUsernameState(null); setIsAdmin(false); return; }
    const stored = getUsername();
    if (!stored) await exchangeSupabaseToken(session.access_token);
    setUsernameState(getUsername());
    const me = await fetchMe();
    setIsAdmin(!!me?.is_admin);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      resolveUser(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      resolveUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    clearToken();
    setUsernameState(null);
    setIsAdmin(false);
    router.push("/");
    router.refresh();
  }

  if (loggedIn === null) return null;

  if (loggedIn) {
    return (
      <div className="flex items-center gap-2 ml-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="font-mono text-[12px] px-2 py-0.5 rounded border border-[#22c55e]/40 text-[#22c55e] hover:border-[#22c55e] transition-colors"
          >
            admin
          </Link>
        )}
        <div className="flex items-center gap-2 border border-white/30 rounded-md px-2 py-0.5 hover:border-white/60 transition-colors">
          {username && (
            <span className="font-mono text-[13px] font-bold text-[#eab308]">@{username}</span>
          )}
          <span className="text-white/20">|</span>
          <button
            onClick={logout}
            className="text-[#a3a3a3] hover:text-white font-mono text-[12px] transition-colors"
          >
            logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="ml-2 border border-white/30 rounded-md px-2.5 py-0.5 text-[#a3a3a3] hover:text-white hover:border-white/60 font-mono text-[13px] transition-colors"
    >
      login
    </Link>
  );
}
