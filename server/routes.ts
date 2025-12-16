import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";

const scenarioIdSchema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, {
  message: "Invalid scenario ID format",
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isDev = process.env.NODE_ENV === "development";
  
  app.use((req, res, next) => {
    const scriptSrc = isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
      : "script-src 'self'; ";
    const styleSrc = isDev
      ? "style-src 'self' 'unsafe-inline'; "
      : "style-src 'self'; ";
    
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      scriptSrc +
      styleSrc +
      "font-src 'self'; " +
      "img-src 'self' data:; " +
      "connect-src 'self' ws: wss:;"
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getAllScenarios();
      const summaries = scenarios.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        environment: s.environment,
        deviceCount: s.devices.length,
        networkCount: s.networks.length,
      }));
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching scenarios:", error);
      res.status(500).json({ error: "Failed to fetch scenarios" });
    }
  });

  app.get("/api/scenarios/:id", async (req, res) => {
    try {
      const idResult = scenarioIdSchema.safeParse(req.params.id);
      if (!idResult.success) {
        res.status(400).json({ error: "Invalid scenario ID format" });
        return;
      }

      const scenario = await storage.getScenarioById(idResult.data);
      if (!scenario) {
        res.status(404).json({ error: "Scenario not found" });
        return;
      }
      res.json(scenario);
    } catch (error) {
      console.error("Error fetching scenario:", error);
      res.status(500).json({ error: "Failed to fetch scenario" });
    }
  });

  return httpServer;
}
