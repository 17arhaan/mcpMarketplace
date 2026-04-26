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

const TOOL_CONTENT: Record<string, ToolContent> = {
  calculator: {
    features: [
      "Evaluate arithmetic, algebra, and scientific expressions",
      "Built-in functions: sqrt, pow, log, sin, cos, tan",
      "Constants: pi, e, inf",
      "Sandboxed execution — no arbitrary code runs",
      "Returns numeric results with full precision",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  calculator       │────▶│  Result     │",
      "│              │     │                   │     │             │",
      "│  \"what is    │     │  parse expression │     │  42.0       │",
      "│   6 * 7?\"   │     │  validate safety  │     │             │",
      "│              │     │  evaluate         │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install calculator

# in your mcp.json
{
  "mcpServers": {
    "calculator": {
      "command": "python",
      "args": ["~/.mcp/tools/calculator/server.py"]
    }
  }
}

# agent can now call:
tools/call → calculate({ "expression": "sqrt(144) + pi" })
→ 15.141592653589793`,
  },
  "web-fetch": {
    features: [
      "Fetch any HTTP/HTTPS URL",
      "Extracts clean plain text from HTML pages",
      "Strips scripts, styles, and navigation",
      "Handles redirects and content encoding",
      "Configurable timeout and max response size",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  web-fetch        │────▶│  Plain Text │",
      "│              │     │                   │     │             │",
      "│  \"read this  │     │  HTTP request     │     │  extracted  │",
      "│   docs page\" │     │  parse HTML       │     │  content    │",
      "│              │     │  extract text     │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
      "",
      "         request          fetch & parse        clean output",
    ].join("\n"),
    usage: `$ mcp-get install web-fetch

# agent can now call:
tools/call → fetch_url({ "url": "https://docs.example.com/api" })
→ "API Reference\\n\\nGET /users — List all users..."`,
  },
  "github-search": {
    features: [
      "Search repositories by name, topic, or language",
      "Search code across all public repositories",
      "Filter by stars, forks, and last updated",
      "Returns structured metadata: description, stars, URL",
      "Uses GitHub public API — no auth required for basic search",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  github-search    │────▶│  Results    │",
      "│              │     │                   │     │             │",
      "│  \"find react │     │  search_repos     │     │  repo list  │",
      "│   ui libs\"   │     │  search_code      │     │  with stars │",
      "│              │     │  ↓                │     │  and URLs   │",
      "│              │     │  GitHub REST API  │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install github-search

# agent can now call:
tools/call → search_repos({ "query": "mcp server language:python" })
→ [{ "name": "...", "stars": 120, "url": "..." }, ...]

tools/call → search_code({ "query": "def handle_tool_call" })
→ [{ "path": "server.py", "repo": "...", "snippet": "..." }, ...]`,
  },
  "postgres-query": {
    features: [
      "Run read-only SQL queries against PostgreSQL",
      "Parameterized queries to prevent SQL injection",
      "Configurable result size limits",
      "Returns structured rows as JSON",
      "Connection string via environment variable",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  postgres-query   │────▶│  JSON Rows  │",
      "│              │     │                   │     │             │",
      "│  \"how many   │     │  validate SQL     │     │  [{ count:  │",
      "│   users?\"    │     │  parameterize     │     │    1042 }]  │",
      "│              │     │  execute (RO)     │     │             │",
      "│              │     │  ↓                │     │             │",
      "│              │     │  PostgreSQL DB    │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install postgres-query

# set connection string
export PG_CONNECTION="postgresql://user:pass@host:5432/db"

# agent can now call:
tools/call → query({
  "sql": "SELECT count(*) FROM users WHERE created_at > $1",
  "params": ["2026-01-01"]
})
→ [{ "count": 1042 }]`,
  },
  weather: {
    features: [
      "Current weather for any city worldwide",
      "Temperature in Celsius and Fahrenheit",
      "Humidity, wind speed, and conditions",
      "Multi-day forecast support",
      "Geocoding built-in — just pass a city name",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  weather          │────▶│  Weather    │",
      "│              │     │                   │     │  Data       │",
      "│  \"weather in │     │  geocode city     │     │             │",
      "│   tokyo?\"    │     │  fetch forecast   │     │  22°C ☀     │",
      "│              │     │  parse response   │     │  humidity:  │",
      "│              │     │  ↓                │     │  65%        │",
      "│              │     │  Weather API      │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install weather

# agent can now call:
tools/call → get_weather({ "city": "Tokyo" })
→ { "temp_c": 22, "temp_f": 72, "condition": "Clear",
     "humidity": 65, "wind_kph": 12 }`,
  },
  filesystem: {
    features: [
      "Read and write files with configurable root directory",
      "List directory contents with metadata",
      "Search files by name pattern or content",
      "Create and delete files and directories",
      "Sandboxed — cannot access outside root path",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  filesystem       │────▶│  File Data  │",
      "│              │     │                   │     │             │",
      "│  \"read the   │     │  validate path    │     │  contents   │",
      "│   config\"    │     │  check sandbox    │     │  or listing │",
      "│              │     │  read / write     │     │  or status  │",
      "│              │     │  ↓                │     │             │",
      "│              │     │  Local Filesystem │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install filesystem

# configure root directory
export FS_ROOT="./project"

# agent can now call:
tools/call → read_file({ "path": "src/index.ts" })
→ "import express from 'express'..."

tools/call → list_directory({ "path": "src" })
→ [{ "name": "index.ts", "size": 1240, "type": "file" }, ...]`,
  },
  slack: {
    features: [
      "Send messages to any channel or DM",
      "Read recent messages from channels",
      "Thread replies and reactions",
      "File and snippet uploads",
      "Bot token authentication via env variable",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  slack            │────▶│  Slack API  │",
      "│              │     │                   │     │             │",
      "│  \"post the   │     │  format message   │     │  #general   │",
      "│   summary\"   │     │  resolve channel  │     │  message    │",
      "│              │     │  send via API     │     │  posted ✓   │",
      "│              │     │  ↓                │     │             │",
      "│              │     │  Slack Web API    │     │             │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install slack

# set bot token
export SLACK_BOT_TOKEN="xoxb-..."

# agent can now call:
tools/call → send_message({
  "channel": "#general",
  "text": "Deploy complete — all tests passing."
})
→ { "ok": true, "ts": "1234567890.123456" }`,
  },
  redis: {
    features: [
      "Get, set, and delete keys",
      "TTL support for expiring keys",
      "List, set, and hash operations",
      "Pub/sub for real-time messaging",
      "Connection via REDIS_URL environment variable",
    ],
    flowchart: [
      "┌─────────────┐     ┌──────────────────┐     ┌─────────────┐",
      "│  AI Agent    │────▶│  redis            │────▶│  Redis DB   │",
      "│              │     │                   │     │             │",
      "│  \"cache this │     │  parse command    │     │  SET key    │",
      "│   result\"    │     │  validate args    │     │  → OK       │",
      "│              │     │  execute          │     │             │",
      "│              │     │  ↓                │     │  GET key    │",
      "│              │     │  Redis Server     │     │  → value    │",
      "└─────────────┘     └──────────────────┘     └─────────────┘",
    ].join("\n"),
    usage: `$ mcp-get install redis

# set connection
export REDIS_URL="redis://localhost:6379"

# agent can now call:
tools/call → set({ "key": "user:1:name", "value": "Arhaan", "ttl": 3600 })
→ "OK"

tools/call → get({ "key": "user:1:name" })
→ "Arhaan"`,
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function contentFromSchema(tool: Tool): ToolContent | null {
  const v = tool.versions.find((ver) => ver.version === tool.latest_version);
  const schemaTool = v?.mcp_schema?.tools as Array<{ name: string; description?: string }> | undefined;
  if (!schemaTool?.length) return null;
  return {
    features: schemaTool.map((t) => `${t.name}${t.description ? ` — ${t.description}` : ""}`),
    flowchart: "",
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

  const content = TOOL_CONTENT[tool.slug] ?? contentFromSchema(tool);

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
