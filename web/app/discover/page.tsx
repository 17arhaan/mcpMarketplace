"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { RequireAuth } from "../components/require-auth";
import { getToken } from "../lib/auth";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const EXAMPLES = [
  "I need to query a Postgres database",
  "Find a tool for fetching web pages",
  "Search GitHub repos and issues",
  "Get weather data for any city",
  "I need a math calculator tool",
  "Help me find file system tools",
];

const LOADING_MESSAGES = [
  "searching the registry...",
  "scanning available tools...",
  "looking through packages...",
  "finding matching tools...",
  "checking the marketplace...",
  "browsing the catalog...",
  "querying the index...",
  "digging through packages...",
];

function getLoadingMessage(query: string): string {
  const q = query.toLowerCase();
  if (q.includes("database") || q.includes("sql") || q.includes("postgres")) return "searching for database tools...";
  if (q.includes("web") || q.includes("fetch") || q.includes("scrape") || q.includes("http")) return "looking for web tools...";
  if (q.includes("file") || q.includes("filesystem") || q.includes("directory")) return "scanning filesystem tools...";
  if (q.includes("github") || q.includes("git") || q.includes("repo")) return "searching git & github tools...";
  if (q.includes("weather") || q.includes("climate")) return "checking for weather tools...";
  if (q.includes("math") || q.includes("calcul") || q.includes("compute")) return "finding math tools...";
  if (q.includes("api") || q.includes("rest") || q.includes("graphql")) return "browsing API tools...";
  if (q.includes("ai") || q.includes("llm") || q.includes("model")) return "searching AI tools...";
  if (q.includes("image") || q.includes("photo") || q.includes("visual")) return "looking for image tools...";
  if (q.includes("email") || q.includes("mail") || q.includes("message")) return "finding communication tools...";
  if (q.includes("search") || q.includes("find") || q.includes("discover")) return "querying the registry...";
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

function DiscoverChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem("discover-chat");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionStorage.setItem("discover-chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMessage = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoadingMsg(getLoadingMessage(userMessage));
    setLoading(true);

    try {
      const token = getToken();
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: userMessage }),
      });
      if (res.status === 401) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Session expired — please log in again." }]);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response || data.error || "Something went wrong." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Could not reach the API. Make sure the server is running." },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-8">
          {messages.length > 0 && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => { setMessages([]); sessionStorage.removeItem("discover-chat"); }}
                className="font-mono text-[11px] text-[#525252] hover:text-[#a3a3a3] transition-colors"
              >
                clear chat
              </button>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="font-mono text-[#22c55e] text-sm mb-2">&gt; mcp-get ask</div>
              <h2 className="text-lg font-bold font-mono text-white mb-1">ai tool discovery</h2>
              <p className="text-[#525252] text-sm font-mono mb-8 text-center max-w-md">
                describe what your agent needs. we&apos;ll search the registry and recommend tools.
              </p>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    onClick={() => send(example)}
                    className="text-left text-xs font-mono bg-[#141414] border border-[#262626] rounded-md px-3 py-2.5 text-[#525252] hover:text-[#a3a3a3] hover:border-[#333] transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className="font-mono text-sm">
                  {msg.role === "user" ? (
                    <div>
                      <span className="text-[#22c55e]">&gt;</span>{" "}
                      <span className="text-white">{msg.content}</span>
                    </div>
                  ) : (
                    <div className="code-block rounded-md px-4 py-3 text-[#a3a3a3] leading-relaxed prose-mono">
                      <ReactMarkdown
                        components={{
                          strong: ({ children }) => <span className="text-white font-bold">{children}</span>,
                          em: ({ children }) => <span className="text-[#f59e0b] italic">{children}</span>,
                          code: ({ children }) => <code className="text-[#22c55e] bg-[#1a1a1a] px-1 py-0.5 rounded text-xs">{children}</code>,
                          ul: ({ children }) => <ul className="list-none space-y-1 mt-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mt-2">{children}</ol>,
                          li: ({ children }) => <li className="flex gap-2"><span className="text-[#22c55e] shrink-0">-</span><span>{children}</span></li>,
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          h1: ({ children }) => <p className="text-white font-bold text-base mb-2">{children}</p>,
                          h2: ({ children }) => <p className="text-white font-bold text-sm mb-2 mt-3">{children}</p>,
                          h3: ({ children }) => <p className="text-white font-bold text-sm mb-1 mt-2">{children}</p>,
                          a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#3b82f6] hover:underline">{children}</a>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="code-block rounded-md px-4 py-3">
                  <span className="text-[#525252] font-mono text-sm animate-pulse">{loadingMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-sm px-5 py-4 shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="max-w-2xl mx-auto flex gap-2"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#22c55e] font-mono text-sm">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="what does your agent need?"
              className="w-full bg-[#141414] border border-[#262626] rounded-md pl-7 pr-4 py-2.5 text-sm text-white placeholder-[#525252] focus:outline-none focus:border-[#333] font-mono transition-colors"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 rounded-md bg-white text-black font-mono text-sm font-medium hover:bg-[#e5e5e5] disabled:bg-[#1a1a1a] disabled:text-[#525252] transition-colors"
          >
            ask
          </button>
        </form>
      </div>
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <RequireAuth>
      <DiscoverChat />
    </RequireAuth>
  );
}
