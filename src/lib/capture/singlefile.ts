import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execFileAsync = promisify(execFile);

const CAPTURED_DIR = path.join(process.cwd(), "captured-pages");

export async function capturePage(url: string, filename: string): Promise<string> {
  await fs.mkdir(CAPTURED_DIR, { recursive: true });

  const outputPath = path.join(CAPTURED_DIR, filename);

  try {
    await execFileAsync("single-file", [
      url,
      "--browser-executable-path", "/usr/bin/chromium-browser",
      "--browser-arg", "--no-sandbox",
      "--browser-arg", "--disable-setuid-sandbox",
      "--filename-conflict-action", "overwrite",
      "--output-directory", CAPTURED_DIR,
      "--filename", filename,
    ], { timeout: 60000 });
  } catch {
    // Fallback: try npx single-file-cli
    await execFileAsync("npx", [
      "single-file-cli",
      url,
      outputPath,
      "--browser-executable-path", "/usr/bin/chromium-browser",
      "--browser-args", "'--no-sandbox --disable-setuid-sandbox'",
    ], { timeout: 60000 });
  }

  // Verify the file was created
  await fs.access(outputPath);
  return outputPath;
}
