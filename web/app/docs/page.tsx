import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Learn how to use the MCP Marketplace CLI and API.",
};

const CLI_COMMANDS = [
  { cmd: "mcp-get login", desc: "Authenticate and save your API key" },
  { cmd: "mcp-get search <query>", desc: "Full-text search the tool registry" },
  { cmd: "mcp-get install <slug>", desc: "Download, verify, and install a tool" },
  { cmd: "mcp-get install <slug@version>", desc: "Install a specific version" },
  { cmd: "mcp-get uninstall <slug>", desc: "Remove a tool and clean up config" },
  { cmd: "mcp-get update", desc: "Update all installed tools to latest" },
  { cmd: "mcp-get list", desc: "Show all installed tools" },
  { cmd: "mcp-get info <slug>", desc: "View tool details, versions, and status" },
  { cmd: "mcp-get publish <dir>", desc: "Package and publish a tool" },
  { cmd: "mcp-get ask \"<query>\"", desc: "AI-powered tool discovery" },
];

const API_ENDPOINTS = [
  { method: "GET", path: "/tools", desc: "Search and browse tools" },
  { method: "GET", path: "/tools/tags", desc: "List all tags" },
  { method: "GET", path: "/tools/:slug", desc: "Tool detail" },
  { method: "GET", path: "/tools/:slug/latest", desc: "Latest version manifest" },
  { method: "POST", path: "/tools", desc: "Publish a new tool" },
  { method: "POST", path: "/tools/:slug/versions", desc: "Publish a new version" },
  { method: "DELETE", path: "/tools/:slug", desc: "Deprecate a tool" },
  { method: "POST", path: "/auth/register", desc: "Create account" },
  { method: "POST", path: "/auth/login", desc: "Login and get JWT" },
  { method: "POST", path: "/auth/api-key", desc: "Generate API key" },
  { method: "POST", path: "/installs", desc: "Log an install" },
  { method: "POST", path: "/ratings", desc: "Rate a tool (1-5)" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 mb-16">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-[var(--border)]">{title}</h2>
      {children}
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 font-mono text-sm text-gray-300 overflow-x-auto leading-relaxed">
      {children}
    </pre>
  );
}

export default function DocsPage() {
  const NAV = [
    { id: "getting-started", label: "Getting Started" },
    { id: "cli", label: "CLI Commands" },
    { id: "api", label: "API Reference" },
    { id: "publishing", label: "Publishing Tools" },
    { id: "mcp-protocol", label: "MCP Protocol" },
    { id: "ai-discovery", label: "AI Discovery" },
    { id: "security", label: "Security" },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Sidebar nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Documentation</h3>
            <nav className="space-y-1">
              {NAV.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block text-sm text-gray-500 hover:text-white py-1.5 px-3 rounded-lg hover:bg-white/5 transition-all"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="lg:col-span-3">
          <h1 className="text-3xl font-bold mb-2">Documentation</h1>
          <p className="text-gray-400 mb-12">Everything you need to use and build for the MCP Marketplace.</p>

          <Section id="getting-started" title="Getting Started">
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              MCP Marketplace is a registry for Model Context Protocol tools. Install the CLI to discover,
              install, and publish MCP servers.
            </p>
            <CodeBlock>{`# Install the CLI
npm install -g mcp-get

# Login to your account
mcp-get login

# Search and install a tool
mcp-get search weather
mcp-get install weather

# View installed tools
mcp-get list`}</CodeBlock>
            <p className="text-sm text-gray-500 mt-3">
              Tools are installed to <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">~/.mcp/tools/</code> and
              automatically added to your <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">mcp.json</code> configuration.
            </p>
          </Section>

          <Section id="cli" title="CLI Commands">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Command</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {CLI_COMMANDS.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2.5 font-mono text-blue-400 whitespace-nowrap">{row.cmd}</td>
                      <td className="px-4 py-2.5 text-gray-400">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="api" title="API Reference">
            <p className="text-gray-400 text-sm mb-4">
              The API runs at <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">http://localhost:8000</code>.
              Interactive OpenAPI docs at <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">/docs</code>.
            </p>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Method</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Path</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {API_ENDPOINTS.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-mono font-medium px-1.5 py-0.5 rounded ${
                          row.method === "GET" ? "text-emerald-400 bg-emerald-500/10" :
                          row.method === "POST" ? "text-blue-400 bg-blue-500/10" :
                          "text-red-400 bg-red-500/10"
                        }`}>
                          {row.method}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-gray-300 text-xs">{row.path}</td>
                      <td className="px-4 py-2.5 text-gray-400">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="publishing" title="Publishing Tools">
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Create an <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">mcp.json</code> manifest
              in your tool directory and run <code className="text-gray-400 bg-gray-800/50 px-1.5 py-0.5 rounded">mcp-get publish</code>.
            </p>
            <CodeBlock>{`{
  "name": "my-tool",
  "slug": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py",
  "tags": ["utilities"]
}`}</CodeBlock>
            <p className="text-sm text-gray-500 mt-3">
              After publishing, your tool runs in a Docker sandbox with no network access, 256 MB memory,
              and a 30-second timeout. If it passes, it goes live automatically.
            </p>
          </Section>

          <Section id="mcp-protocol" title="MCP Protocol">
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              MCP tools communicate over stdio using JSON-RPC 2.0. Your server must handle these methods:
            </p>
            <div className="space-y-3 text-sm">
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <code className="text-blue-400 font-mono font-medium">initialize</code>
                <p className="text-gray-500 mt-1">Return server info and capabilities.</p>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <code className="text-blue-400 font-mono font-medium">tools/list</code>
                <p className="text-gray-500 mt-1">Return array of available tools with input schemas.</p>
              </div>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
                <code className="text-blue-400 font-mono font-medium">tools/call</code>
                <p className="text-gray-500 mt-1">Execute a tool with given arguments and return results.</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              See the <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">MCP specification</a> for full protocol details.
            </p>
          </Section>

          <Section id="ai-discovery" title="AI Discovery">
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Describe what your AI agent needs in plain English. Claude uses an agentic tool-use loop
              to search the registry, evaluate tools, and recommend the best fit.
            </p>
            <CodeBlock>{`# CLI (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=sk-ant-...
mcp-get ask "I need to query a Postgres database"

# Web UI
# Visit /discover for a chat interface`}</CodeBlock>
          </Section>

          <Section id="security" title="Security">
            <div className="space-y-3 text-sm">
              {[
                "Tools are never executed on the API server — all validation runs in isolated Docker containers.",
                "Sandbox containers have no network access, read-only filesystem, 256 MB memory, and run as non-root.",
                "API keys are stored as SHA-256 hashes. The raw key is returned once and never logged.",
                "Passwords are bcrypt-hashed. JWTs expire after 1 hour.",
                "Tarball checksums (SHA-256) are verified on download before extraction.",
                "Publish endpoints are rate-limited to prevent abuse.",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 text-gray-400">
                  <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
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
