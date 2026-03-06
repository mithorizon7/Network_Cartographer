# full production readiness audit Checklist

Source of truth checklist for a large/intense task.

## Metadata

- Created: 2026-03-06T15:41:57
- Last Updated: 2026-03-06T15:54:00
- Workspace: /Users/davedxn/Downloads/Network_Cartographer
- Checklist Doc: /Users/davedxn/Downloads/Network_Cartographer/docs/full-production-readiness-audit-production-checklist.md

## Scope

- [x] Q-000 [status:verified] Complete a full-stack production-readiness audit (server, client, build, security, localization), implement required hardening, and validate final release readiness.

## Sign-off Gate

- [x] G-001 [status:verified] All queued work, findings, fixes, and validations are complete.
- [x] G-002 [status:verified] All findings are resolved or marked `accepted_risk` with rationale and owner.
- [x] G-003 [status:verified] Required validation suite has been rerun on the final code state.
- [x] G-004 [status:verified] Residual risks and follow-ups are documented.

## Rerun Matrix

- [x] G-010 [status:verified] If code changes after any checked `V-*`, reset affected validation items to unchecked.
- [x] G-011 [status:verified] Final sign-off only after a full validation pass completed after the last code edit.

## Audit Queue

- [x] Q-001 [status:verified] Create checklist and baseline scope.
- [x] Q-002 [status:verified] Complete discovery/audit of impacted systems.
- [x] Q-003 [status:verified] Implement required changes.
- [x] Q-004 [status:verified] Expand or update automated tests.
- [x] Q-005 [status:verified] Run full validation suite.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.

## Findings Log

- [x] F-001 [status:verified] [P1] [confidence:0.98] Error middleware could crash the process after already sending an HTTP error response.
  - Evidence: `server/index.ts` pre-fix error handler sent `res.status(...).json(...)` and then executed `throw err`.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P1] [confidence:0.96] API surface lacked battle-ready hardening controls (rate limiting, no-store policy, stronger security headers/CSP shape).
  - Evidence: `server/routes.ts` pre-fix had no API rate limiter and only minimal header policy.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P2] [confidence:0.94] Scenario import accepted oversized payloads and referentially invalid content (broken IDs/cross-links).
  - Evidence: `client/src/components/ScenarioExportImport.tsx` pre-fix validated only schema + minimal counts; no size caps or cross-reference checks.
  - Owner: codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P2] [confidence:0.97] Theme persistence could throw runtime exceptions when storage is blocked/unavailable.
  - Evidence: `client/src/components/ThemeToggle.tsx` pre-fix performed unguarded `localStorage` get/set calls.
  - Owner: codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P2] [confidence:0.93] Development server accepted arbitrary hosts (`allowedHosts: true`), unnecessarily widening local attack surface.
  - Evidence: `server/vite.ts` pre-fix set `allowedHosts: true`.
  - Owner: codex
  - Linked Fix: P-005
- [x] F-006 [status:verified] [P2] [confidence:0.95] Production dependency audit surfaced runtime vulnerabilities.
  - Evidence: initial `npm audit --omit=dev --audit-level=moderate` reported vulnerable `qs`/`minimatch` paths.
  - Owner: codex
  - Linked Fix: P-006

## Fix Log

- [x] P-001 [status:verified] Removed crash-after-response behavior in error middleware, added safe status normalization, and startup-failure catch.
  - Addresses: F-001
  - Evidence: `server/index.ts` updated error handler + async startup catch; validations V-001..V-005 pass.
- [x] P-002 [status:verified] Added API rate limiting plus stronger security headers/CSP and API `Cache-Control: no-store`.
  - Addresses: F-002
  - Evidence: `server/routes.ts` now sets limiter + hardened headers/CSP/HSTS/no-store.
- [x] P-003 [status:verified] Added scenario import guardrails: payload-size limits, file-type checks, and deep referential integrity validation.
  - Addresses: F-003
  - Evidence: `client/src/components/ScenarioExportImport.tsx` + locale updates (`en/lv/ru`).
- [x] P-004 [status:verified] Added guarded theme storage reads/writes and tightened controlled modal close behavior.
  - Addresses: F-004
  - Evidence: `client/src/components/ThemeToggle.tsx`, `client/src/components/UnknownDeviceModal.tsx`.
- [x] P-005 [status:verified] Replaced permissive Vite `allowedHosts: true` with explicit allowlist + env-driven host extension.
  - Addresses: F-005
  - Evidence: `server/vite.ts`.
- [x] P-006 [status:verified] Added `express-rate-limit` dependency and lockfile updates that cleared production audit vulnerabilities.
  - Addresses: F-006
  - Evidence: `package.json`, `package-lock.json`, validation V-006 pass.
- [x] P-007 [status:verified] Expanded smoke testing to cover schema validity, duplicate IDs, cross-reference integrity, and prompt correctness.
  - Addresses: F-003
  - Evidence: `scripts/smoke-test.ts` + validation V-003 pass.

## Validation Log

- [x] V-001 [status:verified] `npm run check`
  - Evidence: 2026-03-06 15:53 EST + pass.
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-03-06 15:53 EST + pass.
- [x] V-003 [status:verified] `npm test`
  - Evidence: 2026-03-06 15:53 EST + pass ("Smoke test passed.").
- [x] V-004 [status:verified] `npm run i18n:check`
  - Evidence: 2026-03-06 15:54 EST + pass (663 keys validated, no missing/empty keys, placeholders aligned).
- [x] V-005 [status:verified] `npm run build`
  - Evidence: 2026-03-06 15:54 EST + pass (client/server production builds succeed).
- [x] V-006 [status:verified] `npm audit --omit=dev --audit-level=moderate`
  - Evidence: 2026-03-06 15:54 EST + pass (0 runtime vulnerabilities).
- [x] V-007 [status:verified] `npm audit --audit-level=moderate`
  - Evidence: 2026-03-06 15:54 EST + fail for dev-only `esbuild`/`vite` chain; tracked as accepted residual risk R-001.

## Residual Risks

- [x] R-001 [status:accepted_risk] Dev-only `esbuild` advisory remains transitively via `vite` and `drizzle-kit`.
  - Rationale: Full remediation currently requires a breaking major `vite` upgrade path; runtime production dependency audit is clean and dev host exposure has been reduced with explicit host allowlisting.
  - Owner: project maintainers
  - Follow-up trigger/date: Reassess on next planned tooling-major update cycle (target by 2026-04-30).
- [x] R-002 [status:accepted_risk] Client bundle still emits the >500k chunk warning in production build.
  - Rationale: Not a correctness/security blocker; defer code-splitting optimization to performance-focused pass to avoid mixing concerns in this hardening release.
  - Owner: project maintainers
  - Follow-up trigger/date: Address during next performance optimization sprint.

## Change Log

- 2026-03-06T15:41:57: Checklist initialized.
- 2026-03-06T15:52:00: Discovery completed; findings/fixes/validations/residual risks documented and sign-off gates closed.
- 2026-03-06T15:54:00: Final full validation rerun completed after last code edit.
