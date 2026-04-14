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

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("installs");
  const [tools, setTools] = useState<Tool[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort, limit: "20" });
      if (query) params.set("q", query);
      const res = await fetch(`${API_URL}/tools?${params}`);
      const data = await res.json();
      setTools(data.tools ?? []);
      setTotal(data.total ?? 0);
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
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">MCP Marketplace</h1>
          <p className="text-xs text-gray-500">npm for AI agent tools</p>
        </div>
        <nav className="flex gap-4 text-sm text-gray-400">
          <Link href="/publish" className="hover:text-white transition-colors">Publish</Link>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search tools..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
          />
          <div className="flex gap-3 mt-3">
            {(["installs", "rating", "newest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                  sort === s ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Searching...</p>
        ) : tools.length === 0 ? (
          <p className="text-gray-500 text-sm">No tools found.</p>
        ) : (
          <>
            <p className="text-gray-500 text-xs mb-4">{total} tool{total !== 1 ? "s" : ""}</p>
            <div className="space-y-3">
              {tools.map((tool) => (
                <Link key={tool.id} href={`/tools/${tool.slug}`} className="block">
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-blue-400 text-sm font-medium">{tool.slug}</span>
                          {tool.latest_version && (
                            <span className="text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">v{tool.latest_version}</span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm">{tool.description}</p>
                      </div>
                      <div className="ml-4 text-right shrink-0">
                        <div className="text-xs text-gray-500">{tool.install_count.toLocaleString()} installs</div>
                        {tool.avg_rating && (
                          <div className="text-xs text-yellow-400">★ {tool.avg_rating.toFixed(1)}</div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600 font-mono">
                      mcp-get install {tool.slug}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
