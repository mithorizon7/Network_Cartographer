import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const base = "https://networkcartographer.replit.app";
const checks = [];
async function request(path, status = 200, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(response.status, status, path);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff", path);
  assert.equal(response.headers.get("x-frame-options"), "DENY", path);
  assert(response.headers.get("content-security-policy")?.includes("frame-ancestors 'none'"), path);
  if (/^\/api(?:\/|$)/i.test(path)) {
    assert.equal(response.headers.get("cache-control"), "no-store", path);
  }
  checks.push({ path, method: options.method ?? "GET", status });
  return response;
}

const root = await request("/");
const csp = root.headers.get("content-security-policy");
assert(csp.includes("script-src 'self'"));
assert(!csp.includes("'unsafe-eval'"));
assert(root.headers.get("strict-transport-security")?.includes("max-age="));
const html = await root.text();
assert(!html.includes("/@vite"));
assert(!html.includes("/src/main.tsx"));
const assets = [
  ...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((m) => m[1])),
];
assert(assets.some((path) => path.endsWith(".js")));
assert(assets.some((path) => path.endsWith(".css")));
const digests = [];
for (const path of assets) {
  assert.match(path, /^\/assets\/[a-zA-Z0-9_.-]+$/);
  const local = await readFile(`dist/public${path}`);
  const remote = Buffer.from(await (await request(path)).arrayBuffer());
  const sha256 = (data) => createHash("sha256").update(data).digest("hex");
  assert.equal(sha256(remote), sha256(local), `Deployed bytes must match release: ${path}`);
  digests.push({ path, sha256: sha256(remote) });
}

const scenarios = await (await request("/api/scenarios")).json();
assert(Array.isArray(scenarios) && scenarios.length > 0);
assert.match(scenarios[0].id, /^[a-zA-Z0-9_-]+$/);
const scenario = await (await request(`/api/scenarios/${scenarios[0].id}`)).json();
assert.equal(scenario.id, scenarios[0].id);
await request("/api/scenarios/invalid%21", 400);
await request("/api/scenarios/release-verification-missing", 404);
await request("/api/release-verification-missing", 404);
await request("/API/release-verification-missing", 404);
const rejected = await request("/api/scenarios", 405, { method: "POST" });
assert.equal(rejected.headers.get("allow"), "GET, HEAD");
for (const path of ["/assets/release-verification-missing.js", "/@vite/client", "/src/main.tsx"]) {
  await request(path, 404);
}
console.log(
  JSON.stringify({ verifiedAt: new Date().toISOString(), base, digests, checks }, null, 2),
);
