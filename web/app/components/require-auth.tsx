"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"loading" | "authed" | "guest">("loading");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setStatus(session ? "authed" : "guest");
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setStatus(session ? "authed" : "guest");
    });
    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="font-mono text-sm text-[#525252] animate-pulse">loading...</span>
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-5 text-center">
        <p className="font-mono text-[#22c55e] text-sm mb-2">~ auth required</p>
        <h2 className="text-xl font-bold font-mono text-white mb-3">Login to continue</h2>
        <p className="font-mono text-sm text-[#525252] mb-8 max-w-sm">
          you need an account to use this feature. it&apos;s free and takes 10 seconds.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-md bg-white text-black font-mono text-sm font-medium hover:bg-[#e5e5e5] transition-colors"
          >
            login →
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 rounded-md border border-[#262626] text-[#a3a3a3] font-mono text-sm hover:text-white hover:border-[#333] transition-colors"
          >
            register
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
