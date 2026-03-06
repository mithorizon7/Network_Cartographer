import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);
const isDevelopment = process.env.NODE_ENV === "development";

app.disable("x-powered-by");

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
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
  const path = req.path;
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
  await registerRoutes(httpServer, app);

  app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
    const error = err as { status?: number; statusCode?: number; message?: string };
    const statusCandidate = error.status || error.statusCode || 500;
    const status =
      Number.isInteger(statusCandidate) && statusCandidate >= 400 && statusCandidate <= 599
        ? statusCandidate
        : 500;
    const rawMessage = error.message || "Internal Server Error";
    const message = status >= 500 && !isDevelopment ? "Internal Server Error" : rawMessage;

    log(`${req.method} ${req.originalUrl} ${status} :: ${rawMessage}`, "error");

    if (res.headersSent) {
      next(err);
      return;
    }

    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})().catch((err: unknown) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  log(`startup failed: ${message}`, "startup");
  process.exit(1);
});
