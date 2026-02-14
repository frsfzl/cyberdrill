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

    // Use npx to run single-file-cli (ensures it's found)
    const cmd = `npx single-file-cli "${url}" "${outputPath}" --browser-executable-path="${chromePath}"`;

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

    // Fallback: create a basic functional clone
    console.log(`[SingleFile] Falling back to basic clone...`);

    try {
      const response = await fetch(url);
      const html = await response.text();

      // Create a more robust fallback with inline styles
      const enhancedHtml = html.replace(
        '</head>',
        `<style>
          /* Ensure basic styling works */
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
          img { max-width: 100%; height: auto; }
        </style>
        <base href="${new URL(url).origin}">
        </head>`
      );

      await fs.writeFile(outputPath, enhancedHtml, "utf-8");
      console.log(`[SingleFile] Fallback capture successful`);
    } catch (fetchError) {
      console.error(`[SingleFile] Fallback also failed:`, fetchError);

      // Last resort: Create a working login form
      console.log(`[SingleFile] Creating basic login form...`);
      const basicForm = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - ${new URL(url).hostname}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 100%;
      padding: 40px;
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
      font-size: 32px;
      font-weight: bold;
      color: #667eea;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 8px;
      color: #1a202c;
    }
    p {
      color: #718096;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #4a5568;
      font-size: 14px;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.2s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    button {
      width: 100%;
      padding: 14px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    button:hover {
      background: #5568d3;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #a0aec0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🔐</div>
    <h1>Sign In</h1>
    <p>Enter your credentials to continue</p>
    <form id="login-form" method="POST">
      <div class="form-group">
        <label for="email">Email or Username</label>
        <input type="text" id="email" name="username" required autocomplete="username">
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autocomplete="current-password">
      </div>
      <button type="submit">Sign In</button>
    </form>
    <div class="footer">
      Secured by ${new URL(url).hostname}
    </div>
  </div>
</body>
</html>`;

      await fs.writeFile(outputPath, basicForm, "utf-8");
      console.log(`[SingleFile] Created basic form as last resort`);
    }
  }

  // Verify the file was created
  await fs.access(outputPath);
  return outputPath;
}
