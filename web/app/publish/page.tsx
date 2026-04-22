import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publish a Tool",
  description: "Share your MCP server with the community. Tools are validated in a secure Docker sandbox.",
};

const STEPS = [
  {
    cmd: "npm install -g mcp-get",
    label: "install the cli",
  },
  {
    cmd: `# server.py — minimal mcp server
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
    label: "create your mcp server",
  },
  {
    cmd: `{
  "name": "my-tool",
  "slug": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.py"
}`,
    label: "add mcp.json manifest",
  },
  {
    cmd: `mcp-get login
mcp-get publish ./my-tool`,
    label: "publish",
  },
];

export default function PublishPage() {
  return (
    <main className="max-w-3xl mx-auto px-5 py-10">
      <div className="mb-10">
        <p className="font-mono text-[#22c55e] text-sm mb-3">~ publish</p>
        <h1 className="text-xl font-bold font-mono text-white mb-2">Publish a Tool</h1>
        <p className="text-[#a3a3a3] text-sm leading-relaxed">
          Share your MCP server with the community. Every tool is validated in an
          isolated Docker sandbox before going live.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6 mb-12">
        {STEPS.map((step, i) => (
          <div key={i}>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[11px] text-[#525252]">{i + 1}.</span>
              <span className="font-mono text-[12px] text-[#a3a3a3]">{step.label}</span>
            </div>
            <div className="code-block rounded-lg overflow-hidden">
              <div className="px-4 py-3 font-mono text-sm text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">
                {step.cmd}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sandbox */}
      <div className="mb-12">
        <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">sandbox validation</h2>
        <div className="code-block rounded-lg p-4">
          <p className="font-mono text-sm text-[#a3a3a3] mb-3">
            every tool runs in an isolated docker container before going live.
          </p>
          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            {[
              "no network access",
              "256 MB memory limit",
              "30-second timeout",
              "non-root execution",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-[#a3a3a3]">
                <span className="text-[#22c55e]">+</span>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* After publish */}
      <div className="mb-12">
        <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">after publishing</h2>
        <div className="code-block rounded-lg divide-y divide-[#262626]">
          <div className="px-4 py-3 font-mono text-sm">
            <span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">check sandbox status</span>
            <br />
            <span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get info</span>{" "}
            <span className="text-[#f59e0b]">my-tool</span>
          </div>
          <div className="px-4 py-3 font-mono text-sm">
            <span className="text-[#525252]">#</span> <span className="text-[#a3a3a3]">publish an update</span>
            <br />
            <span className="text-[#22c55e]">$</span> <span className="text-white">mcp-get publish</span>{" "}
            <span className="text-[#f59e0b]">./my-tool</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-[#262626] pt-8 text-center">
        <div className="code-block rounded-lg inline-block px-5 py-3 font-mono text-sm">
          <span className="text-[#22c55e]">$</span>{" "}
          <span className="text-[#a3a3a3]">npm install -g</span>{" "}
          <span className="text-white">mcp-get</span>
        </div>
        <p className="mt-4">
          <Link href="/docs" className="font-mono text-sm text-[#3b82f6] hover:underline transition-colors">
            read the docs →
          </Link>
        </p>
      </div>
    </main>
  );
}
