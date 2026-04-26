"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { clearToken, getUsername, setUsername } from "../lib/auth";

export function NavAuth() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      if (session) setUsernameState(getUsername());
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
      if (session) {
        setUsernameState(getUsername());
      } else {
        setUsernameState(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    clearToken();
    setUsernameState(null);
    router.push("/");
    router.refresh();
  }

  if (loggedIn === null) return null;

  if (loggedIn) {
    return (
      <div className="flex items-center gap-3">
        {username && (
          <span className="font-mono text-sm font-bold text-[#eab308]">@{username}</span>
        )}
        <button
          onClick={logout}
          className="px-2.5 py-1 rounded text-[#a3a3a3] hover:text-white font-mono text-[13px] transition-colors"
        >
          logout
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="px-2.5 py-1 rounded text-[#a3a3a3] hover:text-white font-mono text-[13px] transition-colors"
    >
      login
    </Link>
  );
}
