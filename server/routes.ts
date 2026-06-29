import type { Express } from "express";
import { createServer, type Server } from "http";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Ollama proxy route - forwards requests to local Ollama
  // Needed because browser on HTTPS can't call HTTP localhost directly
  app.post("/api/ollama/*", async (req, res) => {
    try {
      const { ollamaUrl, endpoint, ...ollamaBody } = req.body;
      const baseUrl = (ollamaUrl || "http://localhost:11434").replace(/\/$/, "");
      const targetUrl = `${baseUrl}${endpoint || "/api/chat"}`;

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ollamaBody),
        signal: AbortSignal.timeout(60000),
      });

      if (!response.ok) {
        const text = await response.text();
        res.status(response.status).json({ error: text });
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (err: any) {
      const isRefused =
        err.message?.includes("ECONNREFUSED") ||
        err.message?.includes("fetch failed") ||
        err.name === "TimeoutError";

      res.status(503).json({
        error: isRefused
          ? `Cannot reach Ollama. Start with: OLLAMA_ORIGINS="*" ollama serve`
          : err.message,
      });
    }
  });

  return httpServer;
}
