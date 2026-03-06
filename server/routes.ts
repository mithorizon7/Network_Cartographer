import type { Express } from "express";
import type { Server } from "http";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";

const scenarioIdSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Invalid scenario ID format",
  });

function buildContentSecurityPolicy(isDev: boolean): string {
  const scriptSrc = ["'self'"];
  const styleSrc = ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"];
  const connectSrc = ["'self'"];

  if (isDev) {
    scriptSrc.push("'unsafe-inline'", "'unsafe-eval'");
    connectSrc.push("ws:", "wss:");
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    `style-src ${styleSrc.join(" ")}`,
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  return directives.join("; ");
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const isDev = process.env.NODE_ENV === "development";
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 2000 : 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  app.use("/api", apiLimiter);

  app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", buildContentSecurityPolicy(isDev));
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "0");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-DNS-Prefetch-Control", "off");

    if (!isDev) {
      res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains");
    }

    if (req.path.startsWith("/api")) {
      res.setHeader("Cache-Control", "no-store");
    }

    next();
  });

  app.get("/api/scenarios", async (req, res) => {
    try {
      const scenarios = await storage.getAllScenarios();
      const summaries = scenarios.map((s) => ({
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
