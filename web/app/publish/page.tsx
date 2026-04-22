import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publish a Tool",
  description: "Share your MCP server with the community. Tools are validated in a secure Docker sandbox.",
};

const STEPS = [
  {
    title: "Install the CLI",
    description: "Get mcp-get installed globally on your machine.",
    code: "npm install -g mcp-get",
  },
  {
    title: "Create your MCP server",
    description: "Build a tool that speaks the MCP JSON-RPC protocol over stdio.",
    code: `# server.py — minimal example
import json, sys

TOOLS = [{
    "name": "hello",
    "description": "Say hello",
    "inputSchema": {
        "type": "object",
        "properties": {"name": {"type": "string"}},
        "required": ["name"]
    }
}]

def handle(req):
    method = req.get("method")
    rid = req.get("id")
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS}}
    if method == "tools/call":
        name = req["params"]["arguments"]["name"]
        return {"jsonrpc": "2.0", "id": rid, "result": {
            "content": [{"type": "text", "text": f"Hello, {name}!"}]
        }}

for line in sys.stdin:
    if line.strip():
        print(json.dumps(handle(json.loads(line))), flush=True)`,
  },
  {
    title: "Add a manifest",
    description: "Create an mcp.json file in your tool directory.",
    code: `{
  "name": "my-tool",
  "slug": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py"
}`,
  },
  {
    title: "Publish",
    description: "Login and publish. Your tool enters a Docker sandbox for validation.",
    code: `mcp-get login
mcp-get publish ./my-tool`,
  },
];

const SANDBOX_FEATURES = [
  { icon: "shield", label: "No network access" },
  { icon: "cpu", label: "256 MB memory limit" },
  { icon: "clock", label: "30-second timeout" },
  { icon: "user", label: "Non-root execution" },
];

export default function PublishPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="mb-12">
        <h1 className="text-3xl font-bold mb-3">Publish a Tool</h1>
        <p className="text-gray-400 leading-relaxed">
          Share your MCP server with the community. Every tool is validated in an
          isolated Docker sandbox before going live — no broken tools, no malicious code.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-8 mb-16">
        {STEPS.map((step, i) => (
          <div key={i} className="flex gap-5">
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                {i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-px flex-1 bg-[var(--border)] mt-2" />
              )}
            </div>
            <div className="flex-1 pb-8">
              <h3 className="font-semibold text-white text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{step.description}</p>
              <pre className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 font-mono text-sm text-gray-300 overflow-x-auto leading-relaxed">
                {step.code}
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Sandbox info */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-12">
        <h3 className="font-semibold text-white mb-1">Sandbox Validation</h3>
        <p className="text-sm text-gray-400 mb-4">
          Every published tool runs in an isolated Docker container. If it passes, it goes live automatically.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SANDBOX_FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-2 text-sm text-gray-300">
              <div className="w-5 h-5 rounded bg-emerald-500/10 flex items-center justify-center shrink-0">
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              {f.label}
            </div>
          ))}
        </div>
      </div>

      {/* After publish */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 mb-12">
        <h3 className="font-semibold text-white mb-1">After Publishing</h3>
        <p className="text-sm text-gray-400 mb-4">
          Track your tool and publish updates.
        </p>
        <div className="space-y-2 font-mono text-sm">
          <div className="bg-gray-900/50 rounded-lg px-4 py-2.5">
            <span className="text-gray-500"># Check sandbox status</span>
            <br />
            <span className="text-gray-300">mcp-get info my-tool</span>
          </div>
          <div className="bg-gray-900/50 rounded-lg px-4 py-2.5">
            <span className="text-gray-500"># Publish an update</span>
            <br />
            <span className="text-gray-300">mcp-get publish ./my-tool</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-8 border-t border-[var(--border)]">
        <p className="text-gray-400 text-sm mb-4">Ready to publish?</p>
        <div className="inline-flex items-center gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-3 font-mono text-sm">
          <span className="text-gray-500">$</span>
          <span className="text-gray-300">npm install -g</span>
          <span className="text-blue-400 font-medium">mcp-get</span>
        </div>
        <p className="mt-4">
          <Link href="/docs" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Read the full documentation →
          </Link>
        </p>
      </div>
    </main>
  );
}
