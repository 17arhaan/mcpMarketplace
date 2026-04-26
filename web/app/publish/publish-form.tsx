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
        if (session) setUsernameState(getUsername());
      });
      supabase.auth.onAuthStateChange((_e, s) => {
        setLoggedIn(!!s);
        if (s) setUsernameState(getUsername());
      });
    });
  }, []);

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
      <div className="code-block rounded-lg p-6 text-center">
        <p className="font-mono text-sm text-[#22c55e] mb-1">tool submitted</p>
        <p className="font-mono text-xs text-[#525252]">
          sandbox validation in progress — check{" "}
          <span className="text-white">mcp-get info {successSlug}</span>
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!tarball) {
      setError("select a tarball (.tar.gz)");
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
          <label className="block font-mono text-[12px] text-[#525252] mb-1">tarball (.tar.gz)</label>
          <input
            required
            type="file"
            accept=".tar.gz,.tgz"
            onChange={(e) => setTarball(e.target.files?.[0] ?? null)}
            className="w-full bg-[#141414] border border-[#262626] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#333] font-mono"
          />
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
        <p className="font-mono text-[12px] text-[#525252]">
          publishing as <span className="font-bold text-[#eab308]">@{username}</span>
        </p>
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
