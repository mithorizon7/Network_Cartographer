import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { assertSupportedRuntime } from "./runtime";

const app = express();
const httpServer = createServer(app);
const isDevelopment = process.env.NODE_ENV === "development";

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function safeLogPath(path: string): string {
  return path
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && (code < 127 || code > 159);
    })
    .join("")
    .slice(0, 200);
}

function safeSerializeForLog(value: unknown): string | null {
  try {
    const serialized = JSON.stringify(value);
    const maxLength = 1200;
    if (serialized.length <= maxLength) {
      return serialized;
    }
    const truncatedCount = serialized.length - maxLength;
    return `${serialized.slice(0, maxLength)}... [truncated ${truncatedCount} chars]`;
  } catch {
    return null;
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = safeLogPath(req.path);
  const shouldLogResponseBody = isDevelopment;
  let capturedJsonResponse: unknown = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson: unknown) {
    capturedJsonResponse = bodyJson;
    return originalResJson.call(res, bodyJson);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (shouldLogResponseBody && capturedJsonResponse !== undefined) {
        const serialized = safeSerializeForLog(capturedJsonResponse);
        if (serialized) {
          logLine += ` :: ${serialized}`;
        }
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  assertSupportedRuntime();
  await registerRoutes(httpServer, app);

  // Default to serving the production build; development must be explicit.
  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  } else {
    serveStatic(app);
  }

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string };
    const statusCandidate = error.status || error.statusCode || 500;
    const status =
      Number.isInteger(statusCandidate) && statusCandidate >= 400 && statusCandidate <= 599
        ? statusCandidate
        : 500;
    const rawMessage = error.message || "Internal Server Error";
    const message = status >= 500 && !isDevelopment ? "Internal Server Error" : rawMessage;

    const safePath = safeLogPath(req.path);
    log(`${req.method} ${safePath} ${status}`, "error");

    if (res.headersSent) {
      next(err);
      return;
    }

    res.status(status).json({ message });
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.requestTimeout = 15_000;
  httpServer.headersTimeout = 10_000;
  httpServer.keepAliveTimeout = 5_000;
  httpServer.maxRequestsPerSocket = 1000;
  httpServer.listen(
    {
      port,
      host: process.env.HOST || (isDevelopment ? "127.0.0.1" : "0.0.0.0"),
    },
    () => {
      const address = httpServer.address();
      const listeningPort = address && typeof address !== "string" ? address.port : port;
      log(`serving on port ${listeningPort}; Node ${process.version}`);
    },
  );
})().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  log(`startup failed: ${message}`, "startup");
  process.exit(1);
});
