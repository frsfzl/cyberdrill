"use client";

import { useEffect, useState, useRef } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface OverviewData {
  overview: {
    totalEmployees: number;
    totalDrills: number;
    emailDrills: number;
    callDrills: number;
    totalInteractions: number;
    clicked: number;
    failed: number;
    clickRate: number;
    failRate: number;
    successRate: number;
  };
}

interface HoverInfo {
  label: string;
  value: number;
  percent: number;
  color: string;
}

function DonutChart({ safe, clicked, failed, total }: { safe: number; clicked: number; failed: number; total: number }) {
  const size = 320;
  const outerR = 140;
  const innerR = 88;
  const cx = size / 2;
  const cy = size / 2;

  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const segments = [
    { label: "Safe", value: safe, color: "#1d4ed8", hover: "#2563eb", glow: "rgba(37,99,235,0.5)" },
    { label: "Clicked", value: clicked, color: "#60a5fa", hover: "#7dd3fc", glow: "rgba(96,165,250,0.4)" },
    { label: "Failed", value: failed, color: "#bfdbfe", hover: "#dbeafe", glow: "rgba(191,219,254,0.4)" },
  ];

  const safeRate = total > 0 ? Math.round((safe / total) * 100) : 0;

  // Build arc segments
  let startAngle = -90;
  const arcs = segments.map((seg) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const sweep = fraction * 360;
    const gap = fraction > 0 ? 1.5 : 0; // degree gap between segments
    const result = { ...seg, start: startAngle + gap / 2, end: startAngle + sweep - gap / 2, fraction };
    startAngle += sweep;
    return result;
  });

  function toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function arcPath(startDeg: number, endDeg: number, inner: number, outer: number) {
    const sweep = endDeg - startDeg;
    if (sweep <= 0) return "";
    const largeArc = sweep > 180 ? 1 : 0;

    const os = { x: cx + outer * Math.cos(toRad(startDeg)), y: cy + outer * Math.sin(toRad(startDeg)) };
    const oe = { x: cx + outer * Math.cos(toRad(endDeg)), y: cy + outer * Math.sin(toRad(endDeg)) };
    const ie = { x: cx + inner * Math.cos(toRad(endDeg)), y: cy + inner * Math.sin(toRad(endDeg)) };
    const is_ = { x: cx + inner * Math.cos(toRad(startDeg)), y: cy + inner * Math.sin(toRad(startDeg)) };

    return [
      `M ${os.x} ${os.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${oe.x} ${oe.y}`,
      `L ${ie.x} ${ie.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${is_.x} ${is_.y}`,
      `Z`,
    ].join(" ");
  }

  return (
    <div
      className="relative transition-all duration-700 ease-out"
      style={{
        width: size,
        height: size + 50,
        transform: mounted ? "scale(1)" : "scale(0.85)",
        opacity: mounted ? 1 : 0,
      }}
    >
      <svg width={size} height={size} style={{ filter: "drop-shadow(0 0 30px rgba(29,78,216,0.12))" }}>
        <defs>
          {/* Gradient for each segment */}
          {segments.map((seg, i) => (
            <linearGradient key={`g${i}`} id={`donut-g-${i}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={seg.hover} />
              <stop offset="100%" stopColor={seg.color} />
            </linearGradient>
          ))}
          {/* Inner shadow for the hole */}
          <radialGradient id="hole-shadow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.15)" />
          </radialGradient>
          {/* Glossy highlight */}
          <linearGradient id="gloss" x1="0.3" y1="0" x2="0.7" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.03)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          {/* Outer glow filter */}
          <filter id="segment-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Subtle background ring */}
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={outerR - innerR} />

        {/* Arc segments */}
        {arcs.map((arc, i) => {
          if (arc.fraction <= 0) return null;
          const isHov = hovered?.label === arc.label;
          const path = arcPath(arc.start, arc.end, innerR, outerR);
          // Compute midpoint angle for hover translation direction
          const midAngle = toRad((arc.start + arc.end) / 2);
          const tx = isHov ? Math.cos(midAngle) * 6 : 0;
          const ty = isHov ? Math.sin(midAngle) * 6 : 0;

          return (
            <path
              key={i}
              d={path}
              fill={`url(#donut-g-${i})`}
              className="cursor-pointer"
              style={{
                filter: isHov ? `drop-shadow(0 0 14px ${arc.glow})` : "none",
                transform: `translate(${tx}px, ${ty}px)`,
                transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1), filter 0.2s ease",
              }}
              onMouseEnter={() => setHovered({
                label: arc.label,
                value: arc.value,
                percent: total > 0 ? Math.round((arc.value / total) * 100) : 0,
                color: arc.color,
              })}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* Glossy overlay on the ring */}
        <circle cx={cx} cy={cy} r={(outerR + innerR) / 2} fill="none" stroke="url(#gloss)" strokeWidth={outerR - innerR} pointerEvents="none" />

        {/* Inner hole shadow (depth illusion) */}
        <circle cx={cx} cy={cy} r={innerR} fill="url(#hole-shadow)" pointerEvents="none" />

        {/* Subtle inner ring highlight */}
        <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} pointerEvents="none" />

        {/* Subtle outer ring highlight */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={1} pointerEvents="none" />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ height: size }}>
        <div className="flex flex-col items-center transition-all duration-200">
          {hovered ? (
            <>
              <span className="text-4xl font-bold text-white tracking-tight">{hovered.percent}%</span>
              <span className="text-sm font-medium mt-1" style={{ color: hovered.color }}>{hovered.label}</span>
              <span className="text-[11px] text-neutral-500 mt-0.5">{hovered.value} interactions</span>
            </>
          ) : (
            <>
              <span className="text-4xl font-bold text-white tracking-tight">{safeRate}%</span>
              <span className="text-sm text-neutral-400 mt-1">Safe Rate</span>
              <span className="text-[11px] text-neutral-600 mt-0.5">{total} total</span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        {segments.map((seg) => (
          <button
            key={seg.label}
            className="flex items-center gap-2 px-2.5 py-1 rounded-full transition-colors duration-150 hover:bg-white/[0.04]"
            onMouseEnter={() => setHovered({
              label: seg.label,
              value: seg.label === "Safe" ? safe : seg.label === "Clicked" ? clicked : failed,
              percent: total > 0 ? Math.round(((seg.label === "Safe" ? safe : seg.label === "Clicked" ? clicked : failed) / total) * 100) : 0,
              color: seg.color,
            })}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className="w-2 h-2 rounded-full ring-2 ring-offset-1 ring-offset-transparent"
              style={{ backgroundColor: seg.color, boxShadow: `0 0 6px ${seg.glow}`, ringColor: seg.color }}
            />
            <span className="text-xs text-neutral-400">{seg.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ChatPanel() {
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
    <div className="col-span-2 rounded-xl bg-[#111118]/40 border border-white/[0.06] flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.06]">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-white">CyberDrill AI</h3>
          <p className="text-[10px] text-neutral-500">Ask about your security data</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Bot className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-300">Ask me anything</p>
              <p className="text-[11px] text-neutral-600 mt-1">I have access to all your drill data</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center mt-2">
              {["Which department is most at risk?", "How many drills have we run?", "Give me a security summary"].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="text-[10px] px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="h-3 w-3 text-blue-400" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-blue-600/20 border border-blue-500/20 text-blue-100"
                  : "bg-white/[0.04] border border-white/[0.06] text-neutral-300"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="h-3 w-3 text-neutral-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-blue-500/15 border border-blue-500/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="h-3 w-3 text-blue-400" />
            </div>
            <div className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
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
      <div className="px-3 pb-3 pt-2 border-t border-white/[0.06]">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your data..."
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/30 focus:ring-1 focus:ring-blue-500/20 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/25 flex items-center justify-center text-blue-400 hover:bg-blue-600/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error("Failed to fetch overview:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <span className="text-sm text-neutral-400">Loading overview...</span>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const { overview } = data;
  const safe = overview.totalInteractions - overview.clicked;
  const clickedOnly = overview.clicked - overview.failed;

  return (
    <DashboardShell>
      <div className="max-w-7xl mx-auto py-8 px-6 space-y-6">
        <div className="grid grid-cols-5 gap-6">
          {/* Left: Donut */}
          <div className="col-span-3 flex flex-col items-center justify-center py-4">
            <h3 className="text-sm font-medium text-white mb-1">Security Score</h3>
            <p className="text-xs text-neutral-500 mb-6">Organization-wide drill performance</p>
            <DonutChart
              safe={safe}
              clicked={clickedOnly}
              failed={overview.failed}
              total={overview.totalInteractions}
            />
          </div>

          {/* Right: Chat */}
          <ChatPanel />
        </div>
      </div>
    </DashboardShell>
  );
}
