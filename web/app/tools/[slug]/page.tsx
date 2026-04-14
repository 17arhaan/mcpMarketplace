import { notFound } from "next/navigation";
import Link from "next/link";

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

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // params is a Promise in Next.js 16
  const { slug } = await params;
  const tool = await getTool(slug);

  if (!tool) notFound();

  const sandboxBadge = (status: string) => {
    const colors: Record<string, string> = {
      passed: "bg-green-900 text-green-300",
      failed: "bg-red-900 text-red-300",
      pending: "bg-yellow-900 text-yellow-300",
      running: "bg-blue-900 text-blue-300",
    };
    return colors[status] ?? "bg-gray-800 text-gray-400";
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Back to marketplace
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Tool header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold font-mono text-blue-400">{tool.slug}</h1>
            {tool.latest_version && (
              <span className="text-sm text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                v{tool.latest_version}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded ${
              tool.status === "active" ? "bg-green-900 text-green-300" : "bg-gray-800 text-gray-400"
            }`}>
              {tool.status}
            </span>
          </div>
          <p className="text-lg text-gray-300 mb-4">{tool.description}</p>

          <div className="flex gap-6 text-sm text-gray-500">
            <span>{tool.install_count.toLocaleString()} installs</span>
            {tool.avg_rating && <span>★ {tool.avg_rating.toFixed(1)} rating</span>}
          </div>
        </div>

        {/* Install command */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-8 font-mono text-sm">
          <p className="text-gray-500 text-xs mb-1">Install</p>
          <p className="text-green-400">mcp-get install {tool.slug}</p>
        </div>

        {/* Versions */}
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">Versions</h2>
          <div className="space-y-2">
            {tool.versions.length === 0 ? (
              <p className="text-gray-600 text-sm">No versions yet.</p>
            ) : (
              tool.versions.map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded px-4 py-2">
                  <span className="font-mono text-sm text-white">v{v.version}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${sandboxBadge(v.sandbox_status)}`}>
                      {v.sandbox_status}
                    </span>
                    <span className="text-xs text-gray-600">
                      {new Date(v.published_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
