"use client";

import { useState, useEffect } from "react";
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

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState("installs");
  const [page, setPage] = useState(1);
  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const totalPages = Math.ceil(total / 20);

  // Debounce text input and reset page when query changes
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch whenever debounced query, sort, or page changes
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ sort, limit: "20", page: String(page) });
        if (debouncedQuery) params.set("q", debouncedQuery);
        const res = await fetch(`${API_URL}/tools?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setTools(data.tools ?? []);
          setTotal(data.total ?? 0);
          setSearched(true);
        }
      } catch {
        if (!cancelled) setTools([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [debouncedQuery, sort, page]);

  return (
    <main>
      {/* Hero — terminal style */}
      <section className="border-b border-[#262626]">
        <div className="max-w-5xl mx-auto px-5 py-16">
          <div className="max-w-2xl">
            <p className="font-mono text-[#22c55e] text-sm mb-4">~ registry for mcp tools</p>
            <h1 className="text-3xl font-bold tracking-tight mb-3 text-white leading-snug">
              Install MCP servers<br />with one command.
            </h1>
            <p className="text-[#a3a3a3] text-[15px] leading-relaxed mb-8">
              Publish, discover, and install Model Context Protocol tools.
              Every package is sandboxed and verified before going live.
            </p>

            {/* Terminal block */}
            <div className="code-block rounded-lg overflow-hidden mb-6">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#262626]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
                <span className="ml-2 text-[11px] text-[#525252]">terminal</span>
              </div>
              <div className="px-4 py-3 text-sm space-y-1">
                <p><span className="text-[#22c55e]">$</span> <span className="text-[#a3a3a3]">npm install -g</span> <span className="text-white">mcp-get</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get search</span> <span className="text-[#f59e0b]">weather</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get install</span> <span className="text-[#f59e0b]">weather</span></p>
                <p className="text-[#525252]">✓ installed weather@1.0.0 → ~/.mcp/tools/weather</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <Link
                href="/publish"
                className="px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-[#e5e5e5] transition-colors"
              >
                Publish a tool
              </Link>
              <Link
                href="/docs"
                className="px-4 py-2 rounded-md border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#333] font-mono transition-colors"
              >
                docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Search + Results */}
      <section className="max-w-5xl mx-auto px-5 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252] font-mono text-sm">/</span>
            <input
              type="text"
              placeholder="search packages..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md pl-7 pr-4 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono transition-colors"
            />
          </div>
          <div className="flex border border-[#262626] rounded-md overflow-hidden">
            {(["installs", "rating", "newest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setSort(s); setPage(1); }}
                className={`px-3 py-2.5 text-xs font-mono transition-colors ${
                  sort === s
                    ? "bg-[#1a1a1a] text-white"
                    : "text-[#525252] hover:text-[#a3a3a3]"
                } ${s !== "installs" ? "border-l border-[#262626]" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {searched && !loading && (
          <p className="text-[11px] font-mono text-[#525252] mb-4">{total} packages</p>
        )}

        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border-b border-[#262626] py-4 animate-pulse">
                <div className="h-3.5 bg-[#1a1a1a] rounded w-32 mb-2" />
                <div className="h-3 bg-[#141414] rounded w-80" />
              </div>
            ))}
          </div>
        ) : tools.length === 0 && searched ? (
          <div className="py-16 text-center">
            <p className="font-mono text-[#525252] text-sm">no packages found</p>
            <Link href="/discover" className="font-mono text-sm text-[#3b82f6] hover:underline mt-2 inline-block">
              try ai search →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#262626]">
            {tools.map((tool, i) => (
              <Link
                key={tool.id}
                href={`/tools/${tool.slug}`}
                className="block py-4 group animate-fade-up"
                style={{ animationDelay: `${i * 30}ms`, opacity: 0 }}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-[#22c55e] group-hover:text-[#4ade80] transition-colors font-medium">
                        {tool.slug}
                      </span>
                      {tool.latest_version && (
                        <span className="font-mono text-[11px] text-[#525252]">
                          v{tool.latest_version}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#a3a3a3] leading-relaxed">{tool.description}</p>
                  </div>
                  <div className="ml-6 shrink-0 text-right font-mono text-[11px] text-[#525252] space-y-0.5">
                    <div>{tool.install_count.toLocaleString()} installs</div>
                    {tool.avg_rating && (
                      <div className="text-[#f59e0b]">★ {Number(tool.avg_rating).toFixed(1)}</div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {searched && !loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-6 mt-8 font-mono text-sm">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
              className="text-[#525252] hover:text-white disabled:opacity-30 transition-colors"
            >
              ← prev
            </button>
            <span className="text-[#525252]">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
              className="text-[#525252] hover:text-white disabled:opacity-30 transition-colors"
            >
              next →
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
