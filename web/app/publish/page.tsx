import Link from "next/link";

export default function PublishPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to marketplace
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-2">Publish a Tool</h1>
        <p className="text-gray-400 mb-8 text-sm">
          Share your MCP server with the community. Tools are validated in an isolated Docker sandbox before going live.
        </p>

        <div className="space-y-6 text-sm">
          <Step n={1} title="Install the CLI">
            <code className="block bg-gray-900 border border-gray-800 rounded px-4 py-2 font-mono text-green-400 mt-2">
              npm install -g mcp-get
            </code>
          </Step>

          <Step n={2} title="Add mcp.json to your tool directory">
            <pre className="bg-gray-900 border border-gray-800 rounded px-4 py-3 font-mono text-xs text-gray-300 mt-2 overflow-x-auto">
{`{
  "name": "my-tool",
  "version": "1.0.0",
  "description": "What your tool does",
  "entry": "server.js",
  "tools": [
    {
      "name": "my_function",
      "description": "...",
      "inputSchema": {
        "type": "object",
        "properties": {
          "param": { "type": "string" }
        },
        "required": ["param"]
      }
    }
  ]
}`}
            </pre>
          </Step>

          <Step n={3} title="Login and publish">
            <code className="block bg-gray-900 border border-gray-800 rounded px-4 py-2 font-mono text-green-400 mt-2">
              mcp-get login
            </code>
            <code className="block bg-gray-900 border border-gray-800 rounded px-4 py-2 font-mono text-green-400 mt-2">
              mcp-get publish ./my-tool
            </code>
          </Step>

          <Step n={4} title="Wait for sandbox validation">
            <p className="text-gray-400 mt-2">
              Your tool runs in an isolated container — no network access, 256 MB memory, 30s timeout.
              Once it passes, it appears in the marketplace automatically.
            </p>
            <code className="block bg-gray-900 border border-gray-800 rounded px-4 py-2 font-mono text-green-400 mt-2">
              mcp-get info my-tool
            </code>
          </Step>
        </div>
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  );
}
