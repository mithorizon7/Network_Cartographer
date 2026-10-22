import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

test("production artifact serves the app without exposing development endpoints", async (t) => {
  const child = spawn(process.execPath, ["dist/index.cjs"], {
    env: { ...process.env, NODE_ENV: "production", PORT: "0", HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const exited = once(child, "exit");
  t.after(async () => {
    child.kill("SIGTERM");
    await exited;
  });
  let output = "";
  child.stderr.on("data", (chunk) => (output += chunk.toString()));
  const base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Startup timed out: ${output}`)), 15_000);
    const fail = (error) => {
      clearTimeout(timer);
      reject(error);
    };
    child.once("error", fail);
    child.once("exit", () => fail(new Error(`Startup failed: ${output}`)));
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      const match = output.match(/serving on port (\d+); Node v/);
      if (match) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
  });

  const root = await fetch(base);
  assert.equal(root.status, 200);
  assert.equal(root.headers.get("x-content-type-options"), "nosniff");
  assert.equal(root.headers.get("x-frame-options"), "DENY");
  assert.equal(root.headers.get("cache-control"), "no-cache");
  const csp = root.headers.get("content-security-policy");
  assert(csp?.includes("script-src 'self'"));
  assert(!csp?.includes("'unsafe-eval'"));
  const html = await root.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)];
  assert(assets.length >= 2, "Production HTML must reference bundled JS and CSS");
  assert(!html.includes("/@vite"));
  assert(!html.includes("/src/main.tsx"));
  for (const [, asset] of assets) {
    assert.equal((await fetch(`${base}${asset}`)).status, 200);
  }

  for (const path of ["/assets/missing.js", "/@vite/client", "/@fs/etc/passwd", "/src/main.tsx"]) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 404, path);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  }
  assert.equal((await fetch(`${base}/api/missing`)).status, 404);
  assert.equal((await fetch(`${base}/api/scenarios`, { method: "POST" })).status, 405);
  assert.equal((await fetch(`${base}/api/scenarios`)).status, 200);
});
