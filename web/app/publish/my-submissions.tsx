"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getFreshToken } from "../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MyTool {
  slug: string;
  name: string;
  status: string;
  latest_version: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { color: string; label: string }> = {
  active: { color: "text-[#22c55e]", label: "live" },
  pending_review: { color: "text-[#f59e0b]", label: "pending review" },
  rejected: { color: "text-red-400", label: "rejected" },
  draft: { color: "text-[#525252]", label: "draft" },
  deprecated: { color: "text-[#525252]", label: "deprecated" },
  removed: { color: "text-red-500", label: "removed" },
};

export function MySubmissions() {
  const [tools, setTools] = useState<MyTool[] | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getFreshToken();
      if (!token) { setTools([]); return; }
      try {
        const res = await fetch(`${API_URL}/auth/me/tools`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) { setTools([]); return; }
        setTools(await res.json());
      } catch { setTools([]); }
    })();
  }, []);

  if (tools === null || tools.length === 0) return null;

  return (
    <div className="border-t border-[#262626] pt-8 mb-8">
      <h2 className="font-mono text-[12px] text-[#525252] uppercase tracking-wider mb-3">your submissions</h2>
      <div className="code-block rounded-lg divide-y divide-[#262626]">
        {tools.map((t) => {
          const meta = STATUS_META[t.status] ?? { color: "text-[#525252]", label: t.status };
          return (
            <div key={t.slug} className="flex items-center justify-between px-4 py-2.5 font-mono text-[12px]">
              <div className="flex items-center gap-3 min-w-0">
                <Link href={`/tools/${t.slug}`} className="text-white hover:underline truncate">{t.slug}</Link>
                {t.latest_version && <span className="text-[#525252]">v{t.latest_version}</span>}
              </div>
              <span className={meta.color}>{meta.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
