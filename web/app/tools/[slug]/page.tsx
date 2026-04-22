import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CopyButton } from "../../components/copy-button";

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
  if (!tool) return { title: "Not Found" };
  return { title: tool.name, description: tool.description };
}

function StatusDot({ status }: { status: string }) {
  const color: Record<string, string> = {
    passed: "bg-[#22c55e]",
    failed: "bg-red-500",
    pending: "bg-[#f59e0b]",
    running: "bg-[#3b82f6]",
  };
  return <span className={`w-2 h-2 rounded-full inline-block ${color[status] ?? "bg-[#525252]"}`} />;
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
    <main className="max-w-5xl mx-auto px-5 py-10">
      {/* Breadcrumb */}
      <div className="font-mono text-[12px] text-[#525252] mb-6">
        <Link href="/" className="hover:text-[#a3a3a3] transition-colors">packages</Link>
        <span className="mx-1.5">/</span>
        <span className="text-[#a3a3a3]">{tool.slug}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold font-mono text-white">{tool.slug}</h1>
              {tool.latest_version && (
                <span className="font-mono text-[12px] text-[#525252]">v{tool.latest_version}</span>
              )}
              {tool.status === "active" && (
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#22c55e]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                  active
                </span>
              )}
            </div>
            <p className="text-[#a3a3a3] text-sm leading-relaxed">{tool.description}</p>
          </div>

          {/* Install */}
          <div className="code-block rounded-lg mb-8">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#262626]">
              <span className="text-[11px] text-[#525252] font-mono">install</span>
              <CopyButton text={`mcp-get install ${tool.slug}`} />
            </div>
            <div className="px-4 py-3 text-sm font-mono">
              <span className="text-[#22c55e]">$</span>{" "}
              <span className="text-white">mcp-get install</span>{" "}
              <span className="text-[#f59e0b]">{tool.slug}</span>
            </div>
          </div>

          {/* Versions */}
          <div>
            <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">versions</h2>
            {tool.versions.length === 0 ? (
              <p className="font-mono text-sm text-[#525252]">no versions published</p>
            ) : (
              <div className="code-block rounded-lg divide-y divide-[#262626]">
                {tool.versions.map((v) => (
                  <div key={v.id} className="flex items-center justify-between px-4 py-2.5 text-sm font-mono">
                    <div className="flex items-center gap-3">
                      <span className={`text-white ${v.version === tool.latest_version ? "font-medium" : "text-[#a3a3a3]"}`}>
                        {v.version}
                      </span>
                      {v.version === tool.latest_version && (
                        <span className="text-[10px] text-[#22c55e] border border-[#22c55e]/30 px-1.5 py-0.5 rounded">latest</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[12px] text-[#525252]">
                      <span className="flex items-center gap-1.5">
                        <StatusDot status={v.sandbox_status} />
                        {v.sandbox_status}
                      </span>
                      <span className="tabular-nums">
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
          <div className="code-block rounded-lg p-4">
            <h3 className="font-mono text-[11px] text-[#525252] uppercase tracking-wider mb-3">package info</h3>
            <dl className="space-y-2 font-mono text-sm">
              {tool.latest_version && (
                <div className="flex justify-between">
                  <dt className="text-[#525252]">version</dt>
                  <dd className="text-white">{tool.latest_version}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#525252]">installs</dt>
                <dd className="text-white">{tool.install_count.toLocaleString()}</dd>
              </div>
              {tool.avg_rating && (
                <div className="flex justify-between">
                  <dt className="text-[#525252]">rating</dt>
                  <dd className="text-[#f59e0b]">★ {Number(tool.avg_rating).toFixed(1)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-[#525252]">published</dt>
                <dd className="text-[#a3a3a3]">
                  {new Date(tool.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="code-block rounded-lg p-4">
            <h3 className="font-mono text-[11px] text-[#525252] uppercase tracking-wider mb-3">quick start</h3>
            <div className="font-mono text-xs text-[#a3a3a3] space-y-1">
              <p><span className="text-[#525252]">#</span> install cli</p>
              <p className="text-white">npm i -g mcp-get</p>
              <p className="mt-2"><span className="text-[#525252]">#</span> install this package</p>
              <p className="text-white">mcp-get install {tool.slug}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
