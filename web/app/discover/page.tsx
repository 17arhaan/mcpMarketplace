"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function DiscoverPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
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
      setMessages((prev) => [...prev, { role: "assistant", content: data.response || data.error }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Is the API running?" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">Discover Tools</h1>
          <p className="text-xs text-gray-500">Describe what you need — AI finds the right MCP tool</p>
        </div>
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Marketplace
        </Link>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg mb-2">What capability does your AI agent need?</p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "I need to query a Postgres database",
                  "Find me a tool for fetching web pages",
                  "Search GitHub repos and issues",
                  "Get weather data for any city",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => setInput(example)}
                    className="text-xs bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-900 border border-gray-800 text-gray-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-500">
                Searching the marketplace...
              </div>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-800 px-6 py-4 shrink-0">
        <div className="max-w-2xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what your AI agent needs..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg px-5 py-3 text-sm font-medium transition-colors"
          >
            Ask
          </button>
        </div>
      </form>
    </main>
  );
}
