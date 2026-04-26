import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { CopyButton } from "../../components/copy-button";
import { RatingForm } from "../../components/rating-form";

interface ToolVersion {
  id: string;
  version: string;
  sandbox_status: string;
  published_at: string;
  mcp_schema: Record<string, unknown> | null;
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
  author_username: string | null;
  author_email: string | null;
}

interface ToolContent {
  features: string[];
  flowchart: string;
  usage: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function buildFlowchart(slug: string, methods: string[]): string {
  const methodList = methods.length ? methods : ["call"];
  const left = "AI Agent";
  const middle = slug;
  const right = "Response";
  const inner = (s: string, w: number) => " " + s + " ".repeat(Math.max(0, w - s.length - 2)) + " ";
  const box = (label: string, content: string[], width: number) => {
    const top = "┌" + "─".repeat(width - 2) + "┐";
    const bottom = "└" + "─".repeat(width - 2) + "┘";
    const labelLine = "│" + inner(label, width - 2) + "│";
    const blank = "│" + " ".repeat(width - 2) + "│";
    const contentLines = content.map((c) => "│" + inner(c, width - 2) + "│");
    while (contentLines.length < 3) contentLines.push(blank);
    return [top, labelLine, blank, ...contentLines.slice(0, 3), bottom];
  };

  const w1 = 16;
  const w2 = Math.max(20, middle.length + 6, ...methodList.map((m) => m.length + 6));
  const w3 = 16;
  const arrow = "──▶";
  const gap = " ".repeat(2);

  const b1 = box(left, ["sends", "request"], w1);
  const b2 = box(middle, methodList.slice(0, 3), w2);
  const b3 = box(right, ["structured", "JSON"], w3);

  const lines: string[] = [];
  for (let i = 0; i < b1.length; i++) {
    const a = i === 1 ? arrow : " ".repeat(arrow.length);
    const c = i === 1 ? arrow : " ".repeat(arrow.length);
    lines.push(b1[i] + gap + a + gap + b2[i] + gap + c + gap + b3[i]);
  }
  return lines.join("\n");
}

function contentFromSchema(tool: Tool): ToolContent | null {
  const v = tool.versions.find((ver) => ver.version === tool.latest_version);
  const schemaTool = v?.mcp_schema?.tools as Array<{ name: string; description?: string }> | undefined;
  if (!schemaTool?.length) {
    return {
      features: [],
      flowchart: buildFlowchart(tool.slug, []),
      usage: `$ mcp-get install ${tool.slug}`,
    };
  }
  return {
    features: schemaTool.map((t) => `${t.name}${t.description ? ` — ${t.description}` : ""}`),
    flowchart: buildFlowchart(tool.slug, schemaTool.map((t) => t.name)),
    usage: `$ mcp-get install ${tool.slug}\n\n# available tools:\n${schemaTool.map((t) => `tools/call → ${t.name}({...})`).join("\n")}`,
  };
}

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

  const content = contentFromSchema(tool);

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

          {/* Features */}
          {content && (
            <div className="mb-8">
              <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">features</h2>
              <div className="code-block rounded-lg divide-y divide-[#262626]">
                {content.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 font-mono text-sm text-[#a3a3a3]">
                    <span className="text-[#22c55e]">+</span>
                    {f}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How it works — flowchart */}
          {content?.flowchart && (
            <div className="mb-8">
              <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">how it works</h2>
              <div className="code-block rounded-lg overflow-x-auto">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#262626]">
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <span className="ml-2 text-[10px] text-[#525252]">data flow</span>
                </div>
                <pre className="px-4 py-4 font-mono text-xs text-[#a3a3a3] leading-none whitespace-pre overflow-x-auto">{content.flowchart}</pre>
              </div>
            </div>
          )}

          {/* Usage example */}
          {content && (
            <div className="mb-8">
              <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">usage</h2>
              <div className="code-block rounded-lg overflow-x-auto">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#262626]">
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <span className="ml-2 text-[10px] text-[#525252]">terminal</span>
                </div>
                <pre className="px-4 py-4 font-mono text-xs text-[#a3a3a3] leading-relaxed whitespace-pre">
                  {content.usage}
                </pre>
              </div>
            </div>
          )}

          {/* Versions */}
          <div className="mt-8">
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

          <RatingForm toolId={String(tool.id)} />
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

          {(tool.author_username || tool.author_email) && (
            <div className="code-block rounded-lg p-4">
              <h3 className="font-mono text-[11px] text-[#525252] uppercase tracking-wider mb-3">author</h3>
              <div className="space-y-2 font-mono text-sm">
                {tool.author_username && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#525252]">handle</span>
                    <span className="font-bold text-[#eab308]">@{tool.author_username}</span>
                  </div>
                )}
                {tool.author_email && (
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[#525252]">contact</span>
                    <a
                      href={`mailto:${tool.author_email}`}
                      className="text-[#3b82f6] hover:underline text-xs truncate"
                    >
                      {tool.author_email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="code-block rounded-lg p-4">
            <h3 className="font-mono text-[11px] text-[#525252] uppercase tracking-wider mb-3">quick start</h3>
            <div className="font-mono text-xs text-[#a3a3a3] space-y-1">
              <p><span className="text-[#525252]">#</span> install cli</p>
              <p className="text-white">npm i -g mcp-get</p>
              <p className="mt-2"><span className="text-[#525252]">#</span> install this package</p>
              <p className="text-white">mcp-get install {tool.slug}</p>
            </div>
          </div>

          <div className="code-block rounded-lg p-4">
            <h3 className="font-mono text-[11px] text-[#525252] uppercase tracking-wider mb-3">protocol</h3>
            <div className="font-mono text-xs text-[#a3a3a3] space-y-1">
              <p><span className="text-[#525252]">transport</span> stdio</p>
              <p><span className="text-[#525252]">format</span> JSON-RPC 2.0</p>
              <p><span className="text-[#525252]">spec</span> <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">modelcontextprotocol.io</a></p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
