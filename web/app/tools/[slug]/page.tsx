import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

interface ToolVersion {
  id: string;
  version: string;
  sandbox_status: string;
  published_at: string;
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
  created_at: string;
  versions: ToolVersion[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getTool(slug: string): Promise<Tool | null> {
  try {
    const res = await fetch(`${API_URL}/tools/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) return { title: "Tool Not Found" };
  return {
    title: `${tool.name} — MCP Tool`,
    description: tool.description,
  };
}

function SandboxBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; dot: string; label: string }> = {
    passed: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400", label: "Verified" },
    failed: { bg: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400", label: "Failed" },
    pending: { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400", label: "Pending" },
    running: { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400", label: "Running" },
  };
  const c = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full border ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getTool(slug);
  if (!tool) notFound();

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-white transition-colors">Tools</Link>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="text-gray-300">{tool.slug}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-2xl font-bold text-white">{tool.name}</h1>
              {tool.status === "active" && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              )}
            </div>
            <p className="text-gray-400 leading-relaxed">{tool.description}</p>
          </div>

          {/* Install */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-8">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Install</h3>
            <div className="flex items-center justify-between bg-gray-900/50 rounded-lg px-4 py-3 font-mono text-sm">
              <div>
                <span className="text-gray-500">$ </span>
                <span className="text-green-400">mcp-get install {tool.slug}</span>
              </div>
              <button
                onClick={() => {}}
                className="text-gray-600 hover:text-white transition-colors"
                title="Copy"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
            {tool.latest_version && (
              <p className="text-xs text-gray-600 mt-2 font-mono">
                Specific version: mcp-get install {tool.slug}@{tool.latest_version}
              </p>
            )}
          </div>

          {/* Versions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Version History
            </h3>
            {tool.versions.length === 0 ? (
              <p className="text-gray-600 text-sm">No versions published yet.</p>
            ) : (
              <div className="space-y-2">
                {tool.versions.map((v) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between bg-[var(--surface)] border rounded-lg px-4 py-3 transition-colors ${
                      v.version === tool.latest_version
                        ? "border-blue-500/30 bg-blue-500/5"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-white font-medium">v{v.version}</span>
                      {v.version === tool.latest_version && (
                        <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-medium">
                          LATEST
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <SandboxBadge status={v.sandbox_status} />
                      <span className="text-xs text-gray-600 tabular-nums">
                        {new Date(v.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              {tool.latest_version && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Version</dt>
                  <dd className="text-white font-mono">{tool.latest_version}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Installs</dt>
                <dd className="text-white">{tool.install_count.toLocaleString()}</dd>
              </div>
              {tool.avg_rating && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Rating</dt>
                  <dd className="text-amber-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {Number(tool.avg_rating).toFixed(1)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Published</dt>
                <dd className="text-gray-300">
                  {new Date(tool.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Start</h3>
            <div className="space-y-2 text-xs text-gray-500 font-mono">
              <p><span className="text-gray-600"># Install the CLI</span></p>
              <p className="text-gray-300">npm install -g mcp-get</p>
              <p className="mt-2"><span className="text-gray-600"># Install this tool</span></p>
              <p className="text-gray-300">mcp-get install {tool.slug}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
