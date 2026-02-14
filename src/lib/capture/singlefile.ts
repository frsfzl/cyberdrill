import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

const CAPTURED_DIR = path.join(process.cwd(), "captured-pages");

// Detect Chrome path based on OS
function getChromePath(): string {
  const platform = process.platform;

  if (platform === "darwin") {
    return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  } else if (platform === "linux") {
    return "/usr/bin/chromium-browser";
  } else if (platform === "win32") {
    return "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  }

  return "google-chrome";
}

export async function capturePage(url: string, filename: string): Promise<string> {
  await fs.mkdir(CAPTURED_DIR, { recursive: true });

  const outputPath = path.join(CAPTURED_DIR, filename);
  const chromePath = getChromePath();

  try {
    console.log(`[SingleFile] Capturing ${url}...`);

    // Use single-file-cli with proper Chrome path
    const cmd = `single-file-cli "${url}" "${outputPath}" --browser-executable-path="${chromePath}"`;

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });

    if (stderr && !stderr.includes("DevTools")) {
      console.warn(`[SingleFile] Warning:`, stderr);
    }

    console.log(`[SingleFile] Successfully captured to ${outputPath}`);
  } catch (error) {
    console.error(`[SingleFile] Capture failed:`, error);

    // Fallback: create a simple fetch-based capture
    console.log(`[SingleFile] Falling back to simple fetch...`);

    try {
      const response = await fetch(url);
      const html = await response.text();
      await fs.writeFile(outputPath, html, "utf-8");
      console.log(`[SingleFile] Fallback capture successful`);
    } catch (fetchError) {
      console.error(`[SingleFile] Fallback also failed:`, fetchError);
      throw new Error(`Failed to capture page: ${(error as Error).message}`);
    }
  }

  // Verify the file was created
  await fs.access(outputPath);
  return outputPath;
}
