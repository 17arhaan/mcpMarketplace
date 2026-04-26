"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { isVerified } from "./lib/verified";

interface Tag {
  name: string;
  slug: string;
}

interface Tool {
  id: string;
  name: string;
  slug: string;
  description: string;
  latest_version: string | null;
  install_count: number;
  avg_rating: number | null;
  status: string;
  tags: Tag[];
  author_username: string | null;
  created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [sort, setSort] = useState("installs");
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<Tag[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [toolsRes, tagsRes] = await Promise.all([
          fetch(`${API_URL}/tools?limit=100&sort=installs`),
          fetch(`${API_URL}/tools/tags`),
        ]);
        const toolsData = await toolsRes.json();
        const tagsData = await tagsRes.json();
        if (!cancelled) {
          setAllTools(toolsData.tools ?? []);
          setTags(tagsData ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isFiltering = debouncedQuery !== "" || activeTag !== null;

  const filtered = useMemo(() => {
    let list = [...allTools];
    if (activeTag) list = list.filter((t) => t.tags?.some((tg) => tg.slug === activeTag));
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (t) =>
          t.slug.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.author_username?.toLowerCase().includes(q),
      );
    }
    if (sort === "rating") list.sort((a, b) => (b.avg_rating ?? 0) - (a.avg_rating ?? 0));
    else if (sort === "newest") list.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    else list.sort((a, b) => b.install_count - a.install_count);
    return list;
  }, [allTools, activeTag, debouncedQuery, sort]);

  const official = useMemo(
    () => allTools.filter((t) => isVerified(t.author_username)).slice(0, 6),
    [allTools],
  );
  const trending = useMemo(
    () => [...allTools].sort((a, b) => b.install_count - a.install_count).slice(0, 6),
    [allTools],
  );
  const latest = useMemo(
    () => [...allTools].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 6),
    [allTools],
  );

  const totalInstalls = allTools.reduce((s, t) => s + t.install_count, 0);
  const verifiedAuthors = new Set(allTools.filter((t) => isVerified(t.author_username)).map((t) => t.author_username)).size;

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-[#262626]">
        <div className="max-w-5xl mx-auto px-5 py-14">
          <div className="max-w-2xl">
            <p className="font-mono text-[#22c55e] text-sm mb-4">~ registry for mcp tools</p>
            <h1 className="text-3xl font-bold tracking-tight mb-3 text-white leading-snug">
              Install MCP servers<br />with one command.
            </h1>
            <p className="text-[#a3a3a3] text-[15px] leading-relaxed mb-6">
              Publish, discover, and install Model Context Protocol tools.
              Every package is sandboxed and reviewed before going live.
            </p>

            <div className="code-block rounded-lg overflow-hidden mb-6">
              <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#262626]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#525252]" />
                <span className="ml-2 text-[11px] text-[#525252]">terminal</span>
              </div>
              <div className="px-4 py-3 text-sm space-y-1">
                <p><span className="text-[#22c55e]">$</span> <span className="text-[#a3a3a3]">npm install -g</span> <span className="text-white">mcp-get</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get install</span> <span className="text-[#f59e0b]">mcp-github</span></p>
                <p className="text-[#525252]">✓ installed mcp-github@0.6.2</p>
              </div>
            </div>

            <div className="flex gap-3 text-sm">
              <Link href="/publish" className="px-4 py-2 rounded-md bg-white text-black font-medium hover:bg-[#e5e5e5] transition-colors">
                Publish a tool
              </Link>
              <Link href="/docs" className="px-4 py-2 rounded-md border border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#333] font-mono transition-colors">
                docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-[#262626] bg-[#0d0d0d]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 font-mono text-[12px]">
          <Stat label="servers" value={allTools.length.toLocaleString()} />
          <Stat label="verified publishers" value={String(verifiedAuthors)} />
          <Stat label="total installs" value={totalInstalls.toLocaleString()} />
          <span className="ml-auto text-[#525252]">updated live</span>
        </div>
      </section>

      {/* Search + Sort + Tags */}
      <section className="max-w-5xl mx-auto px-5 pt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#525252] font-mono text-sm">/</span>
            <input
              type="text"
              placeholder="search by name, description, or author..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-[#141414] border border-[#262626] rounded-md pl-7 pr-4 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono transition-colors"
            />
          </div>
          <div className="flex border border-[#262626] rounded-md overflow-hidden">
            {(["installs", "rating", "newest"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`px-3 py-2.5 text-xs font-mono transition-colors ${
                  sort === s ? "bg-[#1a1a1a] text-white" : "text-[#525252] hover:text-[#a3a3a3]"
                } ${s !== "installs" ? "border-l border-[#262626]" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          <TagPill active={activeTag === null} onClick={() => setActiveTag(null)} label="all" />
          {tags.map((t) => (
            <TagPill key={t.slug} active={activeTag === t.slug} onClick={() => setActiveTag(t.slug)} label={t.name} />
          ))}
        </div>
      </section>

      {/* Results */}
      <section className="max-w-5xl mx-auto px-5 py-8">
        {loading ? (
          <SkeletonGrid />
        ) : isFiltering ? (
          <FilteredView tools={filtered} activeTag={activeTag} query={debouncedQuery} />
        ) : (
          <>
            {official.length > 0 && (
              <ToolSection title="Official & Verified" subtitle="Tools from trusted publishers" tools={official} />
            )}
            <ToolSection title="Top by installs" subtitle="What the community is using" tools={trending} />
            <ToolSection title="Recently added" subtitle="Latest additions to the registry" tools={latest} />
          </>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[#525252]">
      <span className="text-white font-bold">{value}</span> <span>{label}</span>
    </span>
  );
}

function TagPill({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-3 py-1 rounded-full font-mono text-[12px] border transition-colors ${
        active
          ? "bg-white text-black border-white"
          : "bg-transparent text-[#a3a3a3] border-[#262626] hover:border-[#525252] hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function ToolSection({ title, subtitle, tools }: { title: string; subtitle: string; tools: Tool[] }) {
  if (tools.length === 0) return null;
  return (
    <div className="mb-10">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className="font-mono text-sm font-bold text-white">{title}</h2>
          <p className="font-mono text-[11px] text-[#525252]">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </div>
  );
}

function FilteredView({ tools, activeTag, query }: { tools: Tool[]; activeTag: string | null; query: string }) {
  if (tools.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-mono text-[#525252] text-sm mb-2">no tools match</p>
        <Link href="/discover" className="font-mono text-sm text-[#3b82f6] hover:underline">
          try ai search →
        </Link>
      </div>
    );
  }
  return (
    <>
      <p className="font-mono text-[11px] text-[#525252] mb-4">
        {tools.length} {tools.length === 1 ? "tool" : "tools"}
        {activeTag && <> · tag <span className="text-white">{activeTag}</span></>}
        {query && <> · matching <span className="text-white">&ldquo;{query}&rdquo;</span></>}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tools.map((t) => (
          <ToolCard key={t.id} tool={t} />
        ))}
      </div>
    </>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const verified = isVerified(tool.author_username);
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group block code-block rounded-lg p-4 hover:border-[#404040] transition-colors h-full"
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="shrink-0 w-9 h-9 rounded-md bg-[#1a1a1a] border border-[#262626] flex items-center justify-center font-mono text-[14px] font-bold text-white uppercase">
          {tool.slug[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="font-mono text-[13px] font-bold text-white truncate group-hover:text-[#22c55e] transition-colors">
              {tool.slug}
            </h3>
            {verified && <VerifiedBadge />}
          </div>
          <p className="font-mono text-[11px] text-[#525252] truncate">
            by <span className="text-[#eab308]">@{tool.author_username ?? "unknown"}</span>
          </p>
        </div>
      </div>
      <p className="text-[12px] text-[#a3a3a3] leading-relaxed line-clamp-2 mb-3">{tool.description}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1 min-w-0">
          {tool.tags?.slice(0, 2).map((t) => (
            <span key={t.slug} className="font-mono text-[10px] text-[#525252] border border-[#262626] px-1.5 py-0.5 rounded">
              {t.slug}
            </span>
          ))}
        </div>
        <div className="shrink-0 flex items-center gap-3 font-mono text-[11px] text-[#525252]">
          {tool.avg_rating && <span className="text-[#f59e0b]">★ {Number(tool.avg_rating).toFixed(1)}</span>}
          <span>{tool.install_count.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
}

function VerifiedBadge() {
  return (
    <span title="Verified publisher" className="shrink-0 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/50">
      <svg className="w-2 h-2 text-[#3b82f6]" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </span>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="code-block rounded-lg p-4 animate-pulse">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-[#1a1a1a]" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-[#1a1a1a] rounded w-24" />
              <div className="h-2.5 bg-[#141414] rounded w-32" />
            </div>
          </div>
          <div className="h-2.5 bg-[#141414] rounded w-full mb-1.5" />
          <div className="h-2.5 bg-[#141414] rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
