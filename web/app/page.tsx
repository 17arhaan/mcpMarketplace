"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  latest_version: string | null;
  install_count: number;
  avg_rating: number | null;
  status: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const STATS = [
  { label: "MCP Tools", value: "50+" },
  { label: "Installs", value: "10K+" },
  { label: "Contributors", value: "100+" },
];

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("installs");
  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: "20" });
      if (query) params.set("q", query);
      const res = await fetch(`${API_URL}/tools?${params}`);
      const data = await res.json();
      setTools(data.tools ?? []);
      setTotal(data.total ?? 0);
      setSearched(true);
    } catch {
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, [query, sort]);

  useEffect(() => {
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-gray-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            Open-source MCP tool registry
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
            The package manager for{" "}
            <span className="gradient-text">AI agent tools</span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Discover, install, and publish Model Context Protocol servers.
            Give your AI agents real-world capabilities with one command.
          </p>

          {/* Install command */}
          <div className="inline-flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-3 font-mono text-sm mb-10">
            <span className="text-gray-500">$</span>
            <span className="text-gray-300">npm install -g</span>
            <span className="text-blue-400 font-medium">mcp-get</span>
            <button
              onClick={() => navigator.clipboard.writeText("npm install -g mcp-get")}
              className="text-gray-600 hover:text-white transition-colors ml-2"
              title="Copy"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-12">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="mb-6">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search tools... (e.g. weather, database, github)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-xl pl-11 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 text-sm transition-all"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-2">
              {(["installs", "rating", "newest"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sort === s
                      ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                      : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
                >
                  {s === "installs" ? "Most Popular" : s === "rating" ? "Top Rated" : "Newest"}
                </button>
              ))}
            </div>
            {searched && (
              <span className="text-xs text-gray-600">{total} tool{total !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : tools.length === 0 && searched ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-40">&#x1F50D;</div>
            <p className="text-gray-500 text-sm">No tools found. Try a different search term.</p>
            <Link href="/discover" className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Try AI-powered discovery →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tools.map((tool, i) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="block animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
              >
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--border-hover)] hover:bg-[var(--surface-hover)] transition-all group">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="font-mono text-blue-400 text-sm font-semibold group-hover:text-blue-300 transition-colors">
                          {tool.slug}
                        </span>
                        {tool.latest_version && (
                          <span className="text-[11px] text-gray-500 bg-gray-800/60 px-1.5 py-0.5 rounded font-mono">
                            v{tool.latest_version}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm leading-relaxed">{tool.description}</p>
                    </div>
                    <div className="ml-6 text-right shrink-0 flex flex-col items-end gap-1">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path d="M12 5v14M5 12l7 7 7-7" />
                        </svg>
                        {tool.install_count.toLocaleString()}
                      </div>
                      {tool.avg_rating && (
                        <div className="text-xs text-amber-400/80 flex items-center gap-0.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {Number(tool.avg_rating).toFixed(1)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <code className="text-xs text-gray-600 font-mono">
                      mcp-get install {tool.slug}
                    </code>
                    <svg className="w-4 h-4 text-gray-700 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--background)]">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-3">Build and share MCP tools</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Publish your MCP server to the registry. Every tool is validated in a secure Docker sandbox before going live.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/publish"
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Publish a tool
            </Link>
            <Link
              href="/docs"
              className="px-5 py-2.5 rounded-lg bg-white/5 border border-[var(--border)] hover:border-[var(--border-hover)] text-gray-300 hover:text-white text-sm font-medium transition-all"
            >
              Read the docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
