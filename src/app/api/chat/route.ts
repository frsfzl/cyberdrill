import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/db";

const BACKBOARD_API_URL = process.env.BACKBOARD_API_URL || "https://app.backboard.io/api";

// Cache assistant ID and thread IDs in memory (survives across requests in the same process)
let cachedAssistantId: string | null = null;
const threadCache = new Map<string, string>();

async function getOrCreateAssistant(apiKey: string): Promise<string> {
  if (cachedAssistantId) return cachedAssistantId;

  const res = await fetch(`${BACKBOARD_API_URL}/assistants`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "CyberDrill AI" }),
  });

  if (!res.ok) {
    throw new Error(`Failed to create assistant: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  cachedAssistantId = data.assistant_id || data.id;
  console.log("[Chat API] Created assistant:", cachedAssistantId);
  return cachedAssistantId!;
}

async function getOrCreateThread(apiKey: string, assistantId: string, chatThreadId: string): Promise<string> {
  const cached = threadCache.get(chatThreadId);
  if (cached) return cached;

  const res = await fetch(`${BACKBOARD_API_URL}/assistants/${assistantId}/threads`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw new Error(`Failed to create thread: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const threadId = data.thread_id || data.id;
  threadCache.set(chatThreadId, threadId);
  console.log("[Chat API] Created thread:", threadId, "for chat:", chatThreadId);
  return threadId;
}

export async function POST(req: NextRequest) {
  try {
    const { message, threadId: chatThreadId } = await req.json();

    if (!message || !chatThreadId) {
      return NextResponse.json({ error: "Missing message or threadId" }, { status: 400 });
    }

    const apiKey = process.env.BACKBOARD_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Backboard API key not configured" }, { status: 500 });
    }

    // Fetch fresh data from Supabase for RAG context
    const [
      { data: employees },
      { data: campaigns },
      { data: interactions },
    ] = await Promise.all([
      supabase.from("employees").select("*"),
      supabase.from("campaigns").select("*"),
      supabase.from("interactions").select("*, employees(*)").order("updated_at", { ascending: false }),
    ]);

    // Build analytics summary
    const totalEmployees = employees?.length || 0;
    const totalDrills = campaigns?.length || 0;
    const totalInteractions = interactions?.length || 0;

    let clicked = 0;
    let failed = 0;
    const deptMap = new Map<string, { total: number; clicked: number; failed: number }>();

    for (const i of interactions || []) {
      const isEmail = !i.vishing_call_id;
      const dept = (i.employees as { department: string })?.department || "Unknown";
      const entry = deptMap.get(dept) || { total: 0, clicked: 0, failed: 0 };
      entry.total++;

      if (isEmail) {
        if (["LINK_CLICKED", "CREDENTIALS_SUBMITTED", "LEARNING_VIEWED"].includes(i.state)) {
          clicked++;
          entry.clicked++;
        }
        if (["CREDENTIALS_SUBMITTED", "LEARNING_VIEWED"].includes(i.state)) {
          failed++;
          entry.failed++;
        }
      } else {
        if (i.vishing_outcome) { clicked++; entry.clicked++; }
        if (i.vishing_outcome === "failed") { failed++; entry.failed++; }
      }

      deptMap.set(dept, entry);
    }

    const clickRate = totalInteractions > 0 ? Math.round((clicked / totalInteractions) * 100) : 0;
    const failRate = totalInteractions > 0 ? Math.round((failed / totalInteractions) * 100) : 0;
    const safe = totalInteractions - clicked;
    const safeRate = totalInteractions > 0 ? Math.round((safe / totalInteractions) * 100) : 0;

    const deptSummary = Array.from(deptMap.entries())
      .map(([dept, stats]) => {
        const dClickRate = stats.total > 0 ? Math.round((stats.clicked / stats.total) * 100) : 0;
        const dFailRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;
        return `  - ${dept}: ${stats.total} interactions, ${dClickRate}% click rate, ${dFailRate}% fail rate`;
      })
      .join("\n");

    const emailDrills = campaigns?.filter(
      (c: { delivery_method?: string }) => !c.delivery_method || c.delivery_method === "email" || c.delivery_method === "both"
    ).length || 0;
    const callDrills = campaigns?.filter((c: { delivery_method?: string }) => c.delivery_method === "vapi").length || 0;

    const systemContext = `You are CyberDrill AI, an intelligent security analytics assistant for the CyberDrill platform — an organization's phishing simulation and security awareness tool.

You have access to the following LIVE data from the organization's database:

OVERVIEW:
- Total Employees: ${totalEmployees}
- Total Drills (campaigns): ${totalDrills} (${emailDrills} email, ${callDrills} call/vishing)
- Total Interactions: ${totalInteractions}
- Safe Rate: ${safeRate}% (${safe} interactions)
- Click Rate: ${clickRate}% (${clicked} interactions)
- Fail Rate: ${failRate}% (${failed} interactions)

DEPARTMENT BREAKDOWN:
${deptSummary || "  No department data available"}

EMPLOYEE LIST:
${(employees || []).slice(0, 30).map((e: { name: string; department: string; email: string }) => `  - ${e.name} (${e.department}) — ${e.email}`).join("\n")}

Answer questions about this data accurately and concisely. Use specific numbers. If asked about trends or recommendations, base them on the actual data. Keep responses short (2-4 sentences) unless the user asks for detail. Use a professional but friendly tone.`;

    const fullMessage = `[SYSTEM CONTEXT]\n${systemContext}\n\n[USER QUESTION]\n${message}`;

    // Get or create assistant and thread
    const assistantId = await getOrCreateAssistant(apiKey);
    const backboardThreadId = await getOrCreateThread(apiKey, assistantId, chatThreadId);

    // Send message using form data (not JSON)
    const formData = new URLSearchParams();
    formData.append("content", fullMessage);
    formData.append("stream", "false");
    formData.append("memory", "auto");
    formData.append("send_to_llm", "true");
    formData.append("llm_provider", "openai");
    formData.append("model_name", "gpt-4o-mini");

    const response = await fetch(`${BACKBOARD_API_URL}/threads/${backboardThreadId}/messages`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Chat API] Backboard error:", response.status, errText);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const data = await response.json();
    const aiResponse = data.content || data.messages?.[data.messages?.length - 1]?.content || "Sorry, I couldn't generate a response.";

    return NextResponse.json({ response: aiResponse });
  } catch (error) {
    console.error("[Chat API] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
