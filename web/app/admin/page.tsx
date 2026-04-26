"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchMe, getFreshToken } from "../lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Stats {
  users: number;
  admins: number;
  tools_total: number;
  tools_active: number;
  tools_pending: number;
  tools_rejected: number;
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface AdminTool {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: string;
  latest_version: string | null;
  install_count: number;
  avg_rating: number | null;
  created_at: string;
  author_username: string | null;
  author_email: string | null;
}

type Tab = "pending" | "users" | "tools";

export default function AdminPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"checking" | "denied" | "ok">("checking");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pending, setPending] = useState<AdminTool[]>([]);
  const [allTools, setAllTools] = useState<AdminTool[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [busy, setBusy] = useState<string>("");

  const authFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await getFreshToken();
    if (!token) throw new Error("not authenticated");
    return fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` },
    });
  }, []);

  const loadAll = useCallback(async () => {
    const [s, u, p, all] = await Promise.all([
      authFetch("/admin/stats").then((r) => r.json()),
      authFetch("/admin/users").then((r) => r.json()),
      authFetch("/admin/tools/pending").then((r) => r.json()),
      authFetch("/admin/tools").then((r) => r.json()),
    ]);
    setStats(s);
    setUsers(u);
    setPending(p);
    setAllTools(all);
  }, [authFetch]);

  useEffect(() => {
    (async () => {
      const me = await fetchMe();
      if (!me) { router.push("/login"); return; }
      if (!me.is_admin) { setAuthState("denied"); return; }
      setAuthState("ok");
      await loadAll();
    })();
  }, [router, loadAll]);

  async function approve(slug: string) {
    setBusy(slug);
    await authFetch(`/admin/tools/${slug}/approve`, { method: "POST" });
    await loadAll();
    setBusy("");
  }

  async function reject(slug: string) {
    if (!confirm(`Reject ${slug}?`)) return;
    setBusy(slug);
    await authFetch(`/admin/tools/${slug}/reject`, { method: "POST" });
    await loadAll();
    setBusy("");
  }

  async function remove(slug: string) {
    if (!confirm(`Remove ${slug} from public listings?`)) return;
    setBusy(slug);
    await authFetch(`/admin/tools/${slug}`, { method: "DELETE" });
    await loadAll();
    setBusy("");
  }

  async function restore(slug: string) {
    setBusy(slug);
    await authFetch(`/admin/tools/${slug}/restore`, { method: "POST" });
    await loadAll();
    setBusy("");
  }

  async function promote(username: string) {
    setBusy(username);
    await authFetch(`/admin/users/${username}/promote`, { method: "POST" });
    await loadAll();
    setBusy("");
  }

  async function demote(username: string) {
    if (!confirm(`Demote ${username}?`)) return;
    setBusy(username);
    await authFetch(`/admin/users/${username}/demote`, { method: "POST" });
    await loadAll();
    setBusy("");
  }

  if (authState === "checking") {
    return (
      <main className="max-w-5xl mx-auto px-5 py-20 text-center font-mono text-sm text-[#525252]">
        verifying admin access...
      </main>
    );
  }

  if (authState === "denied") {
    return (
      <main className="max-w-md mx-auto px-5 py-20 text-center">
        <p className="font-mono text-sm text-red-400 mb-2">403 — admin only</p>
        <p className="font-mono text-xs text-[#525252]">
          this page is restricted to platform administrators.{" "}
          <Link href="/" className="text-[#3b82f6] hover:underline">go home</Link>
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-5 py-10">
      <div className="mb-8">
        <p className="font-mono text-[#22c55e] text-sm mb-2">~ admin</p>
        <h1 className="text-xl font-bold font-mono text-white">Dashboard</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="users" value={stats.users} />
          <StatCard label="admins" value={stats.admins} accent="text-[#22c55e]" />
          <StatCard label="tools live" value={stats.tools_active} />
          <StatCard label="pending review" value={stats.tools_pending} accent={stats.tools_pending > 0 ? "text-[#f59e0b]" : undefined} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-[#262626]">
        {(["pending", "users", "tools"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 font-mono text-[13px] transition-colors ${
              tab === t ? "text-white border-b-2 border-white -mb-px" : "text-[#525252] hover:text-[#a3a3a3]"
            }`}
          >
            {t}
            {t === "pending" && pending.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-[#f59e0b] text-black px-1.5 py-0.5 rounded">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "pending" && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <p className="font-mono text-sm text-[#525252] py-8 text-center">no tools awaiting review</p>
          ) : (
            pending.map((t) => (
              <div key={t.id} className="code-block rounded-lg p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/tools/${t.slug}`} className="font-mono text-sm font-bold text-white hover:underline">
                        {t.slug}
                      </Link>
                      <span className="font-mono text-[11px] text-[#525252]">v{t.latest_version}</span>
                    </div>
                    <p className="font-mono text-[12px] text-[#a3a3a3] mb-2">{t.description}</p>
                    <p className="font-mono text-[11px] text-[#525252]">
                      by <span className="text-[#eab308]">@{t.author_username}</span>
                      {t.author_email && <> · <a href={`mailto:${t.author_email}`} className="hover:underline">{t.author_email}</a></>}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      disabled={busy === t.slug}
                      onClick={() => approve(t.slug)}
                      className="px-3 py-1.5 rounded border border-[#22c55e]/50 text-[#22c55e] font-mono text-[12px] hover:bg-[#22c55e]/10 disabled:opacity-50 transition-colors"
                    >
                      approve
                    </button>
                    <button
                      disabled={busy === t.slug}
                      onClick={() => reject(t.slug)}
                      className="px-3 py-1.5 rounded border border-red-500/50 text-red-400 font-mono text-[12px] hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "users" && (
        <div className="code-block rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-[#262626] font-mono text-[11px] text-[#525252] uppercase tracking-wider">
            <div className="col-span-3">username</div>
            <div className="col-span-4">email</div>
            <div className="col-span-2">role</div>
            <div className="col-span-2">joined</div>
            <div className="col-span-1 text-right">actions</div>
          </div>
          {users.map((u) => (
            <div key={u.id} className="grid grid-cols-12 px-4 py-2.5 border-b border-[#262626] last:border-0 font-mono text-[12px] items-center">
              <div className="col-span-3 text-white truncate">@{u.username}</div>
              <div className="col-span-4 text-[#a3a3a3] truncate">{u.email}</div>
              <div className="col-span-2">
                {u.is_admin ? (
                  <span className="text-[#22c55e]">admin</span>
                ) : (
                  <span className="text-[#525252]">user</span>
                )}
              </div>
              <div className="col-span-2 text-[#525252] text-[11px]">
                {new Date(u.created_at).toLocaleDateString()}
              </div>
              <div className="col-span-1 text-right">
                {u.is_admin ? (
                  <button
                    disabled={busy === u.username}
                    onClick={() => demote(u.username)}
                    className="text-[#525252] hover:text-red-400 disabled:opacity-50 text-[11px]"
                  >
                    demote
                  </button>
                ) : (
                  <button
                    disabled={busy === u.username}
                    onClick={() => promote(u.username)}
                    className="text-[#525252] hover:text-[#22c55e] disabled:opacity-50 text-[11px]"
                  >
                    promote
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "tools" && (
        <div className="code-block rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 border-b border-[#262626] font-mono text-[11px] text-[#525252] uppercase tracking-wider">
            <div className="col-span-3">slug</div>
            <div className="col-span-2">author</div>
            <div className="col-span-2">status</div>
            <div className="col-span-2">installs</div>
            <div className="col-span-3 text-right">actions</div>
          </div>
          {allTools.map((t) => (
            <div key={t.id} className="grid grid-cols-12 px-4 py-2.5 border-b border-[#262626] last:border-0 font-mono text-[12px] items-center">
              <div className="col-span-3 truncate">
                <Link href={`/tools/${t.slug}`} className="text-white hover:underline">{t.slug}</Link>
              </div>
              <div className="col-span-2 text-[#eab308] truncate">@{t.author_username}</div>
              <div className="col-span-2">
                <StatusBadge status={t.status} />
              </div>
              <div className="col-span-2 text-[#a3a3a3]">{t.install_count.toLocaleString()}</div>
              <div className="col-span-3 text-right space-x-2">
                {t.status === "pending_review" && (
                  <>
                    <button onClick={() => approve(t.slug)} disabled={busy === t.slug} className="text-[#22c55e] hover:underline text-[11px] disabled:opacity-50">approve</button>
                    <button onClick={() => reject(t.slug)} disabled={busy === t.slug} className="text-red-400 hover:underline text-[11px] disabled:opacity-50">reject</button>
                  </>
                )}
                {t.status === "active" && (
                  <button onClick={() => remove(t.slug)} disabled={busy === t.slug} className="text-red-400 hover:underline text-[11px] disabled:opacity-50">remove</button>
                )}
                {(t.status === "removed" || t.status === "rejected") && (
                  <button onClick={() => restore(t.slug)} disabled={busy === t.slug} className="text-[#22c55e] hover:underline text-[11px] disabled:opacity-50">restore</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="code-block rounded-lg p-4">
      <div className="font-mono text-[10px] text-[#525252] uppercase tracking-wider mb-1">{label}</div>
      <div className={`font-mono text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { color: string; label: string }> = {
    active: { color: "text-[#22c55e]", label: "live" },
    pending_review: { color: "text-[#f59e0b]", label: "pending" },
    rejected: { color: "text-red-400", label: "rejected" },
    draft: { color: "text-[#525252]", label: "draft" },
    deprecated: { color: "text-[#525252]", label: "deprecated" },
    removed: { color: "text-red-500", label: "removed" },
  };
  const meta = map[status] ?? { color: "text-[#525252]", label: status };
  return <span className={`font-mono text-[11px] ${meta.color}`}>{meta.label}</span>;
}
