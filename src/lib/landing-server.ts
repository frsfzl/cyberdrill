import express from "express";
import path from "path";
import type { Server } from "http";

let currentServer: Server | null = null;

export function startLandingServer(
  htmlPath: string,
  appUrl: string,
  port: number = 0
): Promise<{ server: Server; port: number }> {
  return new Promise((resolve, reject) => {
    const app = express();
    app.use(express.json());

    // Serve the captured HTML page
    app.get("/", (_req, res) => {
      res.sendFile(path.resolve(htmlPath));
    });

    // Handle form submissions (boolean only -- no credential data)
    app.post("/submit", async (req, res) => {
      const { token, submitted } = req.body;

      if (!token || submitted !== true) {
        return res.status(400).json({ error: "Invalid submission" });
      }

      // Forward boolean event to main app
      try {
        await fetch(`${appUrl}/api/capture-event`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, submitted: true }),
        });
      } catch (error) {
        console.error("Failed to forward capture event:", error);
      }

      res.json({ redirect: `${appUrl}/learn/${token}` });
    });

    const server = app.listen(port, () => {
      const addr = server.address();
      const assignedPort = typeof addr === "object" && addr ? addr.port : port;
      currentServer = server;
      resolve({ server, port: assignedPort });
    });

    server.on("error", reject);
  });
}

export function stopLandingServer(): void {
  if (currentServer) {
    currentServer.close();
    currentServer = null;
  }
}
