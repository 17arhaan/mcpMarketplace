import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to use the MCP Marketplace CLI and API.",
};

const CLI_COMMANDS = [
  { cmd: "mcp-get login", desc: "authenticate and save your API key" },
  { cmd: "mcp-get search <query>", desc: "full-text search the tool registry" },
  { cmd: "mcp-get install <slug>", desc: "download, verify, and install a tool" },
  { cmd: "mcp-get install <slug@version>", desc: "install a specific version" },
  { cmd: "mcp-get uninstall <slug>", desc: "remove a tool and clean up config" },
  { cmd: "mcp-get update", desc: "update all installed tools to latest" },
  { cmd: "mcp-get list", desc: "show all installed tools" },
  { cmd: "mcp-get info <slug>", desc: "view tool details, versions, and status" },
  { cmd: "mcp-get publish <dir>", desc: "package and publish a tool" },
  { cmd: "mcp-get ask \"<query>\"", desc: "ai-powered tool discovery" },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/tools", desc: "search and browse tools" },
  { method: "GET", path: "/tools/tags", desc: "list all tags" },
  { method: "GET", path: "/tools/:slug", desc: "tool detail" },
  { method: "GET", path: "/tools/:slug/latest", desc: "latest version manifest" },
  { method: "POST", path: "/tools", desc: "publish a new tool" },
  { method: "POST", path: "/tools/:slug/versions", desc: "publish a new version" },
  { method: "DELETE", path: "/tools/:slug", desc: "deprecate a tool" },
  { method: "POST", path: "/auth/register", desc: "create account" },
  { method: "POST", path: "/auth/login", desc: "login and get JWT" },
  { method: "POST", path: "/auth/api-key", desc: "generate API key" },
  { method: "POST", path: "/installs", desc: "log an install" },
  { method: "POST", path: "/ratings", desc: "rate a tool (1-5)" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 mb-12">
      <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function DocsPage() {
  const NAV = [
    { id: "getting-started", label: "getting-started" },
    { id: "cli", label: "cli-commands" },
    { id: "api", label: "api-reference" },
    { id: "publishing", label: "publishing" },
    { id: "mcp-protocol", label: "mcp-protocol" },
    { id: "ai-discovery", label: "ai-discovery" },
    { id: "security", label: "security" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-5 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-16">
            <h3 className="font-mono text-[11px] text-[#525252] uppercase tracking-wider mb-3">docs</h3>
            <nav className="space-y-0.5 font-mono text-[13px]">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-[#525252] hover:text-[#a3a3a3] py-1 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="mb-8">
            <p className="font-mono text-[#22c55e] text-sm mb-3">~ docs</p>
            <h1 className="text-xl font-bold font-mono text-white mb-1">Documentation</h1>
            <p className="text-[#a3a3a3] text-sm">everything you need to use and build for mcp-get.</p>
          </div>

          <Section id="getting-started" title="getting started">
            <p className="text-[#a3a3a3] text-sm leading-relaxed mb-4">
              mcp-get is a registry for Model Context Protocol tools. install the CLI to discover,
              install, and publish MCP servers.
            </p>
            <div className="code-block rounded-lg">
              <div className="px-4 py-3 font-mono text-sm space-y-1">
                <p><span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">install the cli</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">npm install -g mcp-get</span></p>
                <p className="pt-1"><span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">login to your account</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get login</span></p>
                <p className="pt-1"><span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">search and install a tool</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get search</span> <span className="text-[#f59e0b]">weather</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get install</span> <span className="text-[#f59e0b]">weather</span></p>
              </div>
            </div>
            <p className="text-[12px] font-mono text-[#525252] mt-3">
              tools install to <span className="text-[#a3a3a3]">~/.mcp/tools/</span> and auto-register in <span className="text-[#a3a3a3]">mcp.json</span>
            </p>
          </Section>

          <Section id="cli" title="cli commands">
            <div className="code-block rounded-lg divide-y divide-[#262626]">
              {CLI_COMMANDS.map((row, i) => (
                <div key={i} className="flex items-start justify-between px-4 py-2.5 font-mono text-sm gap-4">
                  <span className="text-[#22c55e] whitespace-nowrap shrink-0">{row.cmd}</span>
                  <span className="text-[#525252] text-right">{row.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="api" title="api reference">
            <p className="text-[#a3a3a3] text-sm mb-4 font-mono">
              base: <span className="text-white">http://localhost:8000</span> — openapi docs at <span className="text-white">/docs</span>
            </p>
            <div className="code-block rounded-lg divide-y divide-[#262626]">
              {API_ENDPOINTS.map((row, i) => (
                <div key={i} className="flex items-center px-4 py-2 font-mono text-xs gap-3">
                  <span className={`w-12 shrink-0 font-medium ${
                    row.method === "GET" ? "text-[#22c55e]" :
                    row.method === "POST" ? "text-[#3b82f6]" :
                    "text-red-400"
                  }`}>
                    {row.method}
                  </span>
                  <span className="text-white min-w-[180px]">{row.path}</span>
                  <span className="text-[#525252]">{row.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section id="publishing" title="publishing tools">
            <p className="text-[#a3a3a3] text-sm leading-relaxed mb-4">
              create an <span className="text-white font-mono">mcp.json</span> manifest and run{" "}
              <span className="text-white font-mono">mcp-get publish</span>.
            </p>
            <div className="code-block rounded-lg">
              <div className="px-4 py-3 font-mono text-sm text-[#a3a3a3] whitespace-pre leading-relaxed">{`{
  "name": "my-tool",
  "slug": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py",
  "tags": ["utilities"]
}`}</div>
            </div>
            <p className="text-[12px] font-mono text-[#525252] mt-3">
              tools are sandboxed: no network, 256 MB memory, 30s timeout, non-root. passes → goes live.
            </p>
          </Section>

          <Section id="mcp-protocol" title="mcp protocol">
            <p className="text-[#a3a3a3] text-sm leading-relaxed mb-4">
              MCP tools communicate over stdio using JSON-RPC 2.0. your server must handle:
            </p>
            <div className="code-block rounded-lg divide-y divide-[#262626]">
              {[
                { method: "initialize", desc: "return server info and capabilities" },
                { method: "tools/list", desc: "return array of available tools with input schemas" },
                { method: "tools/call", desc: "execute a tool with given arguments and return results" },
              ].map((m) => (
                <div key={m.method} className="flex items-center justify-between px-4 py-2.5 font-mono text-sm">
                  <span className="text-[#3b82f6]">{m.method}</span>
                  <span className="text-[#525252] text-xs">{m.desc}</span>
                </div>
              ))}
            </div>
            <p className="text-[12px] font-mono text-[#525252] mt-3">
              see <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">modelcontextprotocol.io</a> for the full spec.
            </p>
          </Section>

          <Section id="ai-discovery" title="ai discovery">
            <p className="text-[#a3a3a3] text-sm leading-relaxed mb-4">
              describe what your agent needs in plain english. ai searches the registry and recommends the best tools.
            </p>
            <div className="code-block rounded-lg">
              <div className="px-4 py-3 font-mono text-sm space-y-1">
                <p><span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">cli (requires AI_API_KEY)</span></p>
                <p><span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get ask</span> <span className="text-[#f59e0b]">&quot;I need to query a Postgres database&quot;</span></p>
                <p className="pt-1"><span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">or use the web ui at /discover</span></p>
              </div>
            </div>
          </Section>

          <Section id="security" title="security">
            <div className="code-block rounded-lg divide-y divide-[#262626]">
              {[
                "tools run in isolated docker containers — never on the api server",
                "sandbox: no network, read-only fs, 256 MB, non-root",
                "api keys stored as sha-256 hashes — raw key returned once",
                "passwords bcrypt-hashed — jwts expire after 1 hour",
                "tarball checksums (sha-256) verified on download",
                "publish endpoints are rate-limited",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 font-mono text-sm text-[#a3a3a3]">
                  <span className="text-[#22c55e]">+</span>
                  {text}
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </main>
  );
}
