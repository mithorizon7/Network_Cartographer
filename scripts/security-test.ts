import assert from "node:assert/strict";
import { createServer } from "node:http";
import { test } from "node:test";
import express from "express";
import { registerRoutes } from "../server/routes";
import { assertSupportedRuntime } from "../server/runtime";

test("startup refuses unpatched and unsupported Node releases", () => {
  for (const version of ["20.20.0", "22.12.0", "22.23.3", "24.22.0", "26.12.1"]) {
    assert.throws(() => assertSupportedRuntime(version), /security baseline/);
  }
  for (const version of ["22.23.4", "22.24.0", "24.22.1", "24.23.0"]) {
    assert.doesNotThrow(() => assertSupportedRuntime(version));
  }
});

test("read-only API retains security controls on success and rejection paths", async (t) => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const app = express();
  app.disable("x-powered-by");
  const server = createServer(app);
  await registerRoutes(server, app);
  if (previousEnvironment === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousEnvironment;

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => {
    server.closeAllConnections();
    return new Promise<void>((resolve) => server.close(() => resolve()));
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;

  function checkHeaders(response: Response) {
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("x-frame-options"), "DENY");
    assert.equal(response.headers.get("x-powered-by"), null);
    const csp = response.headers.get("content-security-policy");
    assert(csp?.includes("script-src 'self'"));
    assert(!csp?.includes("'unsafe-eval'"));
    assert(csp?.includes("frame-ancestors 'none'"));
  }

  const response = await fetch(`${base}/api/scenarios`);
  assert.equal(response.status, 200);
  checkHeaders(response);
  const scenarios = (await response.json()) as { id: string }[];
  assert(scenarios.length > 0);
  const mixedCase = await fetch(`${base}/API/scenarios`);
  assert.equal(mixedCase.status, 200);
  checkHeaders(mixedCase);
  assert.equal((await fetch(`${base}/api/scenarios/${scenarios[0].id}`)).status, 200);

  for (const [path, status] of [
    ["/api/scenarios/not-a-scenario", 404],
    ["/api/scenarios/invalid.id", 400],
    ["/api/missing", 404],
  ] as const) {
    const rejected = await fetch(`${base}${path}`);
    assert.equal(rejected.status, status);
    checkHeaders(rejected);
    assert(rejected.headers.get("content-type")?.includes("application/json"));
  }

  const writeAttempt = await fetch(`${base}/api/scenarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(writeAttempt.status, 405);
  assert.equal(writeAttempt.headers.get("allow"), "GET, HEAD");
  checkHeaders(writeAttempt);

  let limited: Response | undefined;
  for (let request = 0; request < 300; request += 1) {
    const next = await fetch(`${base}/api/scenarios`);
    await next.arrayBuffer();
    if (next.status === 429) {
      limited = next;
      break;
    }
  }
  assert(limited, "API rate limit must reject requests after its configured budget");
  checkHeaders(limited);
  assert(limited.headers.has("retry-after"));
});
