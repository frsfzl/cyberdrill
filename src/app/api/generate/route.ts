import { NextRequest, NextResponse } from "next/server";
import { generateContent } from "@/lib/ai/gemini";
import { phishingEmailPrompt, vishingScriptPrompt } from "@/lib/ai/prompts";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, companyName, industry, pretextScenario, employeeName, trackingUrl } = body;

    if (!type || !companyName || !pretextScenario) {
      return NextResponse.json(
        { error: "Missing required fields: type, companyName, pretextScenario" },
        { status: 400 }
      );
    }

    if (type === "email") {
      const prompt = phishingEmailPrompt({
        companyName,
        industry: industry || "",
        pretextScenario,
        employeeName: employeeName || "Employee",
        trackingUrl: trackingUrl || "{{TRACKING_URL}}",
      });

      const result = await generateContent(prompt);

      // Parse JSON response
      try {
        const cleaned = result.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const email = JSON.parse(cleaned);
        return NextResponse.json({ email });
      } catch {
        return NextResponse.json(
          { error: "Failed to parse AI response", raw: result },
          { status: 500 }
        );
      }
    }

    if (type === "vishing-script") {
      const prompt = vishingScriptPrompt({
        companyName,
        industry: industry || "",
        pretextScenario,
        employeeName: employeeName || "Employee",
      });

      const script = await generateContent(prompt);
      return NextResponse.json({ script });
    }

    return NextResponse.json(
      { error: "Invalid type. Use 'email' or 'vishing-script'" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Generation failed:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
