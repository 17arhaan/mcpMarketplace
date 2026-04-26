"use client";

import { useState, useEffect } from "react";
import { getFreshToken, getToken, getUsername } from "../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function PublishForm() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [username, setUsernameState] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [description, setDescription] = useState("");
  const [mcpSchema, setMcpSchema] = useState('{"tools":[]}');
  const [tarball, setTarball] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successSlug, setSuccessSlug] = useState("");

  useEffect(() => {
    import("../lib/supabase").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setLoggedIn(!!session);
        if (session) {
          setUsernameState(getUsername());
          fetchUserInfo();
        }
      });
      supabase.auth.onAuthStateChange((_e, s) => {
        setLoggedIn(!!s);
        if (s) { setUsernameState(getUsername()); fetchUserInfo(); }
      });
    });
  }, []);

  async function fetchUserInfo() {
    const token = await getFreshToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsernameState(data.username);
        setEmail(data.email);
      }
    } catch {}
  }

  useEffect(() => {
    setSlug(toSlug(name));
  }, [name]);

  if (loggedIn === null) return null;

  if (!loggedIn) {
    return (
      <div className="code-block rounded-lg p-6 text-center">
        <p className="font-mono text-sm text-[#525252] mb-3">login required to publish</p>
        <a href="/login" className="font-mono text-sm text-[#3b82f6] hover:underline">
          login →
        </a>
      </div>
    );
  }

  if (successSlug) {
    return (
      <div className="code-block rounded-lg p-6 space-y-3">
        <p className="font-mono text-sm text-[#22c55e] text-center">submitted for review ✓</p>
        <div className="font-mono text-[12px] text-[#a3a3a3] leading-relaxed text-center">
          your tool <span className="text-white">{successSlug}</span> is queued for admin approval.
          we&apos;ll review it and you&apos;ll see it go live on{" "}
          <a href={`/tools/${successSlug}`} className="text-[#3b82f6] hover:underline">
            /tools/{successSlug}
          </a>{" "}
          once approved.
        </div>
        <div className="font-mono text-[11px] text-[#525252] text-center">
          status: <span className="text-[#f59e0b]">pending_review</span>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!tarball) {
      setError("select an archive (.tar.gz, .tgz, or .zip)");
      return;
    }
    try {
      JSON.parse(mcpSchema);
    } catch {
      setError("mcp_schema must be valid JSON");
      return;
    }

    setLoading(true);
    const token = await getFreshToken();
    if (!token) { setError("not logged in"); setLoading(false); return; }
    const fd = new FormData();
    fd.append("name", name);
    fd.append("slug", slug);
    fd.append("description", description);
    fd.append("version", version);
    fd.append("mcp_schema", mcpSchema);
    fd.append("tarball", tarball);

    try {
      const res = await fetch(`${API_URL}/tools`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || "publish failed");
        return;
      }
      setSuccessSlug(slug);
    } catch {
      setError("could not reach the API");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Tool"
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono"
          />
        </div>
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">slug</label>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-tool"
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">version</label>
          <input
            required
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.0"
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono"
          />
        </div>
        <div>
          <label className="block font-mono text-[12px] text-[#525252] mb-1">archive (.tar.gz / .tgz / .zip)</label>
          <label className="group flex items-center gap-3 w-full bg-[#141414] border border-[#262626] hover:border-[#333] rounded-md px-3 py-2 text-sm cursor-pointer font-mono transition-colors">
            <input
              required
              type="file"
              accept=".tar.gz,.tgz,.zip,application/gzip,application/zip,application/x-tar,application/x-gzip"
              onChange={(e) => setTarball(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <span className="px-2 py-0.5 rounded border border-[#333] text-[#a3a3a3] text-[12px] group-hover:border-[#525252]">
              choose file
            </span>
            <span className={tarball ? "text-white truncate" : "text-[#525252]"}>
              {tarball ? tarball.name : "no file chosen"}
            </span>
          </label>
        </div>
      </div>
      <div>
        <label className="block font-mono text-[12px] text-[#525252] mb-1">description</label>
        <textarea
          required
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What your tool does"
          className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono resize-none"
        />
      </div>
      <div>
        <label className="block font-mono text-[12px] text-[#525252] mb-1">mcp_schema (JSON)</label>
        <textarea
          required
          rows={4}
          value={mcpSchema}
          onChange={(e) => setMcpSchema(e.target.value)}
          spellCheck={false}
          className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#333] font-mono resize-none"
        />
      </div>
      {error && <p className="font-mono text-sm text-red-400">{error}</p>}
      {username && (
        <div className="code-block rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[12px] text-[#525252]">publishing as</span>
            <span className="font-mono text-sm font-bold text-[#eab308]">@{username}</span>
          </div>
          {email && (
            <span className="font-mono text-[12px] text-[#525252]">{email}</span>
          )}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-md bg-white text-black font-mono text-sm font-medium hover:bg-[#e5e5e5] disabled:bg-[#1a1a1a] disabled:text-[#525252] transition-colors"
      >
        {loading ? "uploading..." : "publish tool →"}
      </button>
    </form>
  );
}
