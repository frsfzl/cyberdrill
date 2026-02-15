"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function DashboardPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [threadId] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cyberdrill_chat_thread");
      if (stored) return stored;
      const id = Math.random().toString(36).slice(2, 10);
      localStorage.setItem("cyberdrill_chat_thread", id);
      return id;
    }
    return "default";
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, threadId }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Failed to connect. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-col h-[calc(100vh-2rem)] max-w-4xl mx-auto px-6 py-6">
        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-white">Cyberdrill AI</h2>
                <p className="text-sm text-neutral-500 mt-1">Ask me anything about your security data</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-md">
                {[
                  "Which department is most at risk?",
                  "How many drills have we run?",
                  "Give me a security summary",
                  "What's our overall fail rate?",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-blue-400" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600/20 border border-blue-500/20 text-blue-100"
                    : "bg-white/[0.04] border border-white/[0.06] text-neutral-300"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-neutral-400" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="pt-4 pb-2">
          <form
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/25 flex items-center justify-center text-blue-400 hover:bg-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
