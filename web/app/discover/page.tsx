"use client";

import { useState, useRef, useEffect } from "react";

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

export default function DiscoverPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    setLoading(true);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });
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
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="font-mono text-[#22c55e] text-sm mb-2">&gt; mcp-get ask</div>
              <h2 className="text-lg font-bold font-mono text-white mb-1">ai tool discovery</h2>
              <p className="text-[#525252] text-sm font-mono mb-8 text-center max-w-md">
                describe what your agent needs. claude will search the registry and recommend tools.
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
                    <div className="code-block rounded-md px-4 py-3 text-[#a3a3a3] whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="code-block rounded-md px-4 py-3">
                  <span className="text-[#525252] font-mono text-sm animate-pulse">searching registry...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-sm px-5 py-4 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
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
        <p className="text-center text-[10px] font-mono text-[#525252] mt-2">
          powered by claude — requires ANTHROPIC_API_KEY
        </p>
      </div>
    </main>
  );
}
