"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { exchangeSupabaseToken } from "../lib/auth";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      setError("username: 3–30 chars, letters/numbers/_ only");
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (authError) { setError(authError.message); return; }

      if (data.session) {
        const jwt = await exchangeSupabaseToken(data.session.access_token);
        if (!jwt) { setError("Auth exchange failed — check your API server."); return; }
        router.push("/");
        router.refresh();
        return;
      }

      setUnconfirmed(true);
    } finally {
      setLoading(false);
    }
  }

  if (unconfirmed) {
    return (
      <main className="max-w-sm mx-auto px-5 py-20 text-center">
        <p className="font-mono text-[#22c55e] text-sm mb-2">check your email</p>
        <p className="font-mono text-sm text-[#a3a3a3]">
          a confirmation link has been sent to <span className="text-white">{email}</span>.
          click it, then{" "}
          <Link href="/login" className="text-[#3b82f6] hover:underline">login</Link>.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-sm mx-auto px-5 py-20">
      <div className="mb-8">
        <p className="font-mono text-[#22c55e] text-sm mb-3">~ auth</p>
        <h1 className="text-xl font-bold font-mono text-white">Register</h1>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="your_handle"
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono"
          />
        </div>
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono"
          />
        </div>
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono"
          />
        </div>
        {error && <p className="font-mono text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-md bg-white text-black font-mono text-sm font-medium hover:bg-[#e5e5e5] disabled:bg-[#1a1a1a] disabled:text-[#525252] transition-colors"
        >
          {loading ? "creating account..." : "register →"}
        </button>
        <p className="text-center font-mono text-[12px] text-[#525252]">
          have an account?{" "}
          <Link href="/login" className="text-[#3b82f6] hover:underline">
            login
          </Link>
        </p>
      </form>
    </main>
  );
}
