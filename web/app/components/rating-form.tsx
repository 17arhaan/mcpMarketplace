"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getFreshToken, getUsername } from "../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function RatingForm({ toolId }: { toolId: string }) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    import("../lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setLoggedIn(!!session);
        if (session) setUsername(getUsername());
      });
      supabase.auth.onAuthStateChange((_e, s) => {
        setLoggedIn(!!s);
        if (s) setUsername(getUsername());
      });
    });
  }, []);

  if (loggedIn === null) return null;

  if (!loggedIn) {
    return (
      <div className="mt-8">
        <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">rate this tool</h2>
        <div className="code-block rounded-lg p-4 flex items-center justify-between">
          <p className="font-mono text-sm text-[#525252]">login to leave a rating</p>
          <div className="flex gap-2">
            <Link href="/login" className="font-mono text-xs text-[#3b82f6] hover:underline">login</Link>
            <span className="text-[#525252] font-mono text-xs">·</span>
            <Link href="/register" className="font-mono text-xs text-[#3b82f6] hover:underline">register</Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-8">
        <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">rate this tool</h2>
        <div className="code-block rounded-lg p-4">
          <p className="font-mono text-sm text-[#22c55e]">✓ rating submitted</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!score) {
      setError("select a score");
      return;
    }
    setLoading(true);
    setError("");
    const token = await getFreshToken();
    if (!token) { setError("not logged in"); setLoading(false); return; }
    try {
      const res = await fetch(`${API_URL}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tool_id: toolId, score, review: review || null }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "rating failed");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("could not reach the API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider">rate this tool</h2>
        {username && (
          <span className="font-mono text-[12px] font-bold text-[#eab308]">as @{username}</span>
        )}
      </div>
      <div className="code-block rounded-lg p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScore(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                className={`text-xl leading-none transition-colors ${
                  s <= (hover || score) ? "text-[#f59e0b]" : "text-[#525252]"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="optional review..."
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono resize-none"
          />
          {error && <p className="font-mono text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !score}
            className="px-4 py-2 rounded-md bg-white text-black font-mono text-sm font-medium hover:bg-[#e5e5e5] disabled:bg-[#1a1a1a] disabled:text-[#525252] transition-colors"
          >
            {loading ? "submitting..." : "submit rating"}
          </button>
        </form>
      </div>
    </div>
  );
}
