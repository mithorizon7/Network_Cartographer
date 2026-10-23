# Security Audit 2026-10-22 Checklist

## Metadata

Created: 2026-10-22. Updated: 2026-10-23. Workspace: Network_Cartographer. Detailed evidence and follow-up: security-audit-2026-10-22.md.

## Scope

- [x] Q-000 [status:verified] Audit repository, resolved and installed dependencies, accessible delivery metadata and October 21-22 incident baseline. Preserve eight existing onboarding modifications. Follow-up authorization: finish fixes, commit/merge and deploy. Do not rotate unrelated credentials or change system-wide settings.

## Sign-off Gate

- [ ] G-001 [status:blocked] Application release validation passed locally; CI/merge/deployment underway. Full infrastructure certification still requires inaccessible provider host and historical incident evidence.
- [ ] G-002 [status:in_progress] All confirmed repository dependency findings resolved, including braces. External runtime/delivery verification remains in progress; no external risk acceptance inferred.
- [x] G-003 [status:verified] Local final validation passed after follow-up changes. Translation-only edits rerun through i18n, format, build and production-artifact tests; final reviewed changes additionally gated on CI.
- [ ] G-004 [status:blocked] Deployment, incident-response and device/account instructions recorded in security-audit-2026-10-22.md; remaining risks not accepted on behalf of owner.

## Rerun Matrix

- [x] G-010 [status:verified] Reruns passed on patched Node 22.23.4, superseding disk-exhaustion interruption and HTML cache assertion failure. Linux wrapper and final reviewed tree remain gated on CI.

## Audit Queue

- [x] Q-007 [status:verified] Removed braces through supported toolchain upgrades. Verified complete mobile mission, desktop keyboard map selection, table/comparison, dark theme and EN/LV/RU rendering. Narrow-screen controls wrap; untranslated task labels and tutorial phrases corrected.
- [x] Q-008 [status:verified] Committed b4befcf and merged PR #7 as df4d327 after CI run 39833192810 passed every step, including checksum-verified Linux deployment bootstrap. Owner SSH and scoped owner gh credentials used without changing active account. Main now requires PR and GitHub Actions build (app 15368), up-to-date branch, no force pushes/deletion, admin enforcement and conversation resolution; zero independent reviewer requirement is explicit for solo maintenance.
- [ ] Q-009 [status:in_progress] Synchronize and publish verified Replit app aff19e5e-883a-4a41-badf-9e88bb454182, preserving its local changes. Provider reports older Node 20 workspace, stale main and existing deployment https://networkcartographer.replit.app. Recheck actual deployed runtime and public behavior.

- [x] Q-001 [status:verified] Review March audit and current changes before executing code. Prior headers, rate limits, input guards and crash fix remain in source. Previous vulnerability scan is stale.
- [x] Q-002 [status:verified] Compromise precheck: inspect manifests, installed metadata, project filenames and recent dependency history without Python/package lifecycle execution. No project LiteLLM/Python environment, container configuration or named indicators found. Historical external usage unknown.
- [x] Q-003 [status:verified] Refresh primary baseline sources, GitHub/npm advisories, OSV Vite record, and official CISA GitHub mirror (catalog release 2026-10-21). Bun web tool failed; official HTML fetched with curl; eMudhra/QPACK fix not established by release text.
- [x] Q-004 [status:verified] GitHub main is af548ed, unprotected; no deployment records returned. Repository homepage identifies Replit Module-Cartographer; connector cannot find it even by URL. Failed April CI run has no job steps; archived log retrieval returns 410. Railway requires reauthentication.
- [x] Q-005 [status:verified] npm 10.9.9 initial lockfile audit: 37 package findings (1 critical, 27 high, 7 moderate, 2 low). Separate installed inventory checked. Gitleaks 8.30.1: 49 commits, no detected secrets. Built-in pattern scan: 403 historical blobs, no detected credentials. Manual server/client/build review completed.
- [x] Q-006 [status:verified] Targeted fixes installed with scripts disabled into isolated validation copy. Typecheck, lint, scenario smoke tests, 2 HTTP/runtime security tests, i18n and Vite 6.4.5 build pass; source reviewed and delivery report written. Two pre-existing onboarding files received formatting only, preserving implementation.

## Findings Log

- [ ] F-017 [status:in_progress] [P1] [confidence:1.0] At an explicitly measured 320x568 Russian viewport the layer coach mark covered the layer buttons and normal clicks could not unlock Next. Reserve vertical space through target-aware scrolling and resize recovery; use concise short-screen practice guidance and smaller actionable quiz/detail targets. Preserve the full explanation for assistive technology and normal-height screens. Validate actual hit targets and normal clicks, not merely rendered text.

- [ ] F-016 [status:in_progress] [P1] [confidence:1.0] Back from Learning Check to the completed first action reset its gate while only Next Action remained available. Keep per-run completed gates, reject stale/double-click advancement and clear them only for a fresh run. Replay also remounts LearningPrompts so prior selected answers do not block the fresh practice. Evidence: actual Back interaction at step 8 to 7 left Next disabled with no Complete Action control; new regression tests cover gate history, fresh-run reset and stale advancement.

- [ ] F-014 [status:in_progress] [P2] [confidence:1.0] Actual public mobile inspection enabled Next without revealing below-screen device details. Once inspection succeeds, move the tutorial spotlight to the existing details panel; retain collapsed-panel fallback. Evidence: live 390x844 run on first successful release 0bb98cb.
- [ ] F-015 [status:in_progress] [P1] [confidence:1.0] Actual public mobile Learning Check tooltip highlighted only the question and covered the answer buttons, blocking normal clicks and advancement. Highlight the complete learning card before answering, then the feedback afterward. Add localized, non-color-only answer status and polite announcement using existing translations. Evidence: live step 8 screenshot and normal answer click leaving Next disabled on 0bb98cb; rerun actual mobile and desktop interactions after fix.

- [ ] F-013 [status:in_progress] [P1] [confidence:1.0] Provider Node module shadowed the working Nix candidate and inherited an OpenSSL CA override. On October 23 the catalog now supplies patched Node 22.23.4 and 24.22.1. Select the supported Node 22 module to match .nvmrc/CI, explicitly select patched bundled CAs, retain strict engines/scripts/TLS, and remove the unused custom Nix workaround. Actual provider environment and publish validation remain required. The previously observed generated module addition is authorized for correction by the owner's October 23 request.

- [ ] F-012 [status:in_progress] [P1] [confidence:1.0] Second actual publish used correct a37ad344 snapshot but still invoked npm install on Node 22.22.0. Platform installer flags do not control the observed stage; exact internal cause unexposed. Add checksum-pinned project Nix Node provisioning before installer, remove competing old Node module, and enforce lifecycle scripts disabled in .npmrc. Evidence: second complete publish log, build 0c6323ec-45cc-4b24-b7a1-d47fbf0502e9; actual Nix/runtime and publish verification required.

- [ ] F-011 [status:in_progress] [P1] [confidence:1.0] First actual publish rejected by Replit automatic package installation on ambient Node 22.22.0 before reviewed bootstrap ran. Runtime guard correctly failed closed; old public deployment remains live. Explicitly disable platform package installation/import guessing so reviewed bootstrap performs installation on verified Node without relaxing engine/audit safeguards. Evidence: publish failure 2026-10-22 15:03 EDT and Replit build log; official packager.features.enabledForHosting documentation.

- [x] F-010 [status:verified] [P2] [confidence:1.0] Production build environment can omit required dev build tools when NODE_ENV=production, and formatter scans downloaded runtime/platform caches. Build explicitly includes dev dependencies and audits them; production mode applies to compilation. Formatter excludes generated directories only. Evidence: npm ci include/omit options and Replit formatting timeout; CI production-mode bootstrap required.

- [x] F-009 [status:verified] [P2] [confidence:1.0] Theme preference overwritten before initialization: desktop/mobile dark mode reset to light on reload. Read saved theme in lazy state initializer before persistence effect, retaining blocked-storage fallback. Evidence: actual Russian mobile reload, ThemeToggle.tsx; follow-up browser test and CI required.

- [x] F-001 [status:verified] [P1] [confidence:1.0] Repository runtime/CI pins repaired; .npmrc enforces engines; startup rejects unsupported Node. Verified tests use checksum-verified temporary Node 22.23.4. Original machine and deployment runtime updates remain pending (R-001). Evidence: .nvmrc, package.json, .replit, server/runtime.ts and V-002/V-007. Owner: codex (local fixes); maintainer (delivery follow-up).
- [ ] F-002 [status:in_progress] [P2] [confidence:1.0] Replit app access recovered using list endpoint; initial workspace on stale main and Node 20. Deployment synchronization/runtime checks underway. Historical compromise and provider host state remain unverified. Evidence: Q-009 and provider inspection. Owner: codex/provider.
- [x] F-003 [status:verified] [P1] [confidence:1.0] Vulnerable dependencies patched and braces removed via toolchain migration. Final full npm audit, including dev dependencies: zero findings. Evidence: package-lock.json and audit-release-final.json. Owner: codex.
- [x] F-004 [status:verified] [P2] [confidence:1.0] Headers ran after limiter and request parsing; 429s lacked protections and read-only API parsed unused bodies. Removed body parsing, moved headers before limiter, added JSON 404/405 and tests. Evidence: server/routes.ts, server/index.ts and scripts/security-test.ts. Owner: codex (local fixes); maintainer (delivery follow-up).
- [x] F-005 [status:verified] [P2] [confidence:1.0] Default runtime mode could load Vite source-serving middleware. Development now explicit; production build removes dev import. Default local dev listener restricted to loopback; Replit explicit HOST retained. Evidence: server/index.ts, server/static.ts, production bundle and V-005. Owner: codex (local fixes); maintainer (delivery follow-up).
- [x] F-006 [status:verified] [P2] [confidence:1.0] .gitignore did not exclude credentials/evidence. Added env/key/certificate/evidence exclusions; no matching leaked secrets detected in history. Evidence: .gitignore and V-004. Owner: codex (local fixes); maintainer (delivery follow-up).
- [x] F-007 [status:verified] [P2] [confidence:1.0] Main branch protection applied and read back through GitHub API. PR plus strict GitHub Actions build check required; force pushes and deletion blocked, admin enforcement enabled. Independent approval count is zero, not claimed as external review. Evidence: branch-protection-request.json and API response, 2026-10-22. Owner: codex.
- [x] F-008 [status:verified] [P2] [confidence:1.0] CI/hooks relied on home-directory formatting/lint-staged config. Added repository-local equivalents; replaced npx fallback with explicit local hook executable. Evidence: .prettierrc.json, .lintstagedrc.cjs, .husky/pre-commit and V-007. Owner: codex (local fixes); maintainer (delivery follow-up).

## Fix Log

- [x] P-004 [status:verified] Removed braces through toolchain migration; completed accessible responsive onboarding, translated task targets, map role and focus recovery; production HTML cache regression test added. Addresses F-003/F-005; evidence: source, full suite, manual browser interactions and CI run 39833192810.
- [x] P-005 [status:verified] Moved theme initialization ahead of storage persistence and removed competing mount effect. Addresses F-009. Evidence: ThemeToggle.tsx; browser reload check tracked in V-012.

- [x] P-001 [status:verified] Added .nvmrc/engines, updated Replit module, pinned CI actions by verified SHA, reduced workflow permissions and disabled persisted Git credentials. F-001. Evidence: .nvmrc, package.json, .replit, .github/workflows/ci.yml and V-007. Addresses: F-001 and F-008.
- [x] P-002 [status:verified] Patched Vite 6.4.5, ws 8.22.0, proxy-addr 2.0.8, qs 6.16.1, Drizzle 0.45.4 and transitive vulnerabilities; build-only dependencies moved to dev; compatible transitive overrides validated. F-003. Evidence: package-lock.json and V-006/V-007. Addresses: F-003.
- [x] P-003 [status:verified] API/status/static serving/logging/request-timeout hardening plus security regression tests. F-004/F-005. Evidence: server/index.ts, server/routes.ts, server/static.ts and V-005/V-007. Addresses: F-004 and F-005.

## Validation Log

- [x] V-016 [status:verified] 2026-10-23 fresh local release pass on Node 22.23.4/npm 10.9.9: typecheck, lint, formatting, 689-key EN/LV/RU validation, scenario smoke test, two security tests, production build and bundled-server test all pass; full npm audit reports zero findings. Bundled/default roots both count 116 and contain no emSign ECC G3. Replit configuration changes require native validation and CI after final edit.

- [x] V-015 [status:verified] The initial Nix candidate evaluated/built successfully but was shadowed by provider module provisioning, so the unused workaround was removed. Exact final candidate 1010e24 passed full native Replit production-mode bootstrap, all CI commands and both npm audits (zero findings). Ordinary shells resolve supported Node 22.23.4/npm 10.9.9 before PATH overrides; bundled/default CA stores both contain 116 certificates, no emSign ECC G3, no extras; strict engines/scripts/TLS effective. PR #14 CI runs 40004851523 and 40004842643 passed; merged as 0bb98cb. Replit release/reviewed-0bb98cb is clean and tree-identical (8f00f3d5) to the validated candidate. Actual publication is tracked separately in V-014.

- [ ] V-014 [status:in_progress] October 23 publication started from merged 0bb98cb using the Replit UI after independently reading the critical-vulnerability blocking switch as checked. Verify actual installer/build/runtime logs and successful publication. A workspace build and Linux CI alone do not establish this provider pipeline behavior.

- [x] V-013 [status:verified] PR #12 CI run 39835515546 passed the Linux deployment build with parent NODE_ENV=production and explicit dev-tool installation; generated runtime/cache directories are ignored by formatting. Full application-source validation retained. Later PR #14 CI run 39839583110 also passed.

- [x] V-012 [status:verified] Dark and light preferences each survived full browser reload on the fixed build; modal Shift+Tab/Tab containment and Escape focus restoration verified. Local typecheck, lint, format, build and production-artifact test pass. System-preference/blocked-storage fallback source-reviewed. Follow-up commit requires CI before publish.

- [x] V-001 [status:verified] Read-only source/metadata precheck completed before installs/builds/tests; raw evidence directory /private/tmp/network-cartographer-security-2026-10-22 mode 0700, excluded from Git. Evidence: 2026-10-22 pass for the recorded local check; see private audit evidence and detailed report.
- [x] V-002 [status:verified] Temporary Node 22.23.4 official archive SHA256 checked. Old Node includes emSign ECC G3 root; patched Node does not. No trust override environment keys found in audit process. Original system unchanged. Evidence: 2026-10-22 pass for the recorded local check; see private audit evidence and detailed report.
- [x] V-003 [status:verified] npm ci --ignore-scripts in isolated copy; CycloneDX SBOM generated privately; no Python startup or suspect artifact execution. Evidence: 2026-10-22 pass for the recorded local check; see private audit evidence and detailed report.
- [x] V-004 [status:verified] Gitleaks 8.30.1: 49 commits, working diff and production bundle scans all report no detected secrets, with redaction enabled. Built-in pattern scan covers 403 historical blobs. Evidence: 2026-10-22 pass for check execution; private JSON/log files, 2026-10-22 13:15-13:16 EDT.
- [x] V-005 [status:verified] Production API/asset and dev-source checks: unknown API 404, POST API 405, missing asset 404, /@vite/client and /src/main.tsx 404. Patched production bundle starts; old runtime exits 1 before listening. Evidence: 2026-10-22 pass for check execution; local HTTP checks and startup output, 2026-10-22 13:16-13:24 EDT.
- [x] V-006 [status:verified] Follow-up full npm audit including dev dependencies reports zero findings; braces absent from lock and installed tree. Evidence: audit-toolchain-final.json and clean install output, 2026-10-22 EDT.
- [x] V-007 [status:verified] Follow-up suite passed: typecheck, lint, format, 689-key three-locale validation, scenario smoke test, two security tests, production build and production-artifact test. All-dependency audit zero. Evidence: 2026-10-22 local release runs; translation-only changes rerun through affected checks. Final reviewed tree revalidated by CI.
- [x] V-009 [status:verified] Browser checks: 390px complete mobile mission through gates and learning-check feedback; 320px Russian layout without document overflow; accessible map nodes and desktop keyboard selection; table/comparison, LV/RU and theme. Invalid saved-state recovery source-reviewed only; direct browser storage mutation unsupported, not claimed tested.
- [x] V-010 [status:verified] PR #7 CI run 39833192810 passed all checks on b4befcf; exact Linux deployment bootstrap and production-artifact test passed. Main protected; merge df4d327 confirmed and local checkout synchronized. Evidence: GitHub Actions jobs API and merge response.
- [ ] V-011 [status:in_progress] Synchronize verified Replit app, publish, check actual runtime, match deployed asset hashes to merged source, and test public learning flow and rejection/header behavior.
- [x] V-008 [status:verified] OSV cross-check completed for 855 unique package/version pairs; no MAL record matched. Evidence: 2026-10-22 13:27 EDT pass for query execution; only one advisory pair returned, so documented coverage discrepancy with npm remains.

## Residual Risks

- [ ] R-001 [status:blocked] Provider runtime, host kernel, edge TLS/HTTP3, trust stores, rotation status and logs unavailable; require platform evidence. No production sign-off claimed.
- [x] R-002 [status:verified] Removed braces entirely by upgrading Tailwind 4.3.3, TypeScript ESLint 8.72 and lint-staged 17.6; replaced Tailwind animation plugin and updated merge helper. Full lock and installed npm audits now report zero findings. Evidence: audit-toolchain-final.json and clean npm ci; browser compatibility verification still queued in Q-007.
- [x] R-003 [status:verified] Replaced original node_modules with npm ci --ignore-scripts using verified Node 22.23.4 and final lockfile; prior extraneous Playwright removed. Evidence: clean install and full audit output.
- [x] R-004 [status:verified] Formatting-only changes resolve the prior onboarding files' style failures; final format check passes.

## Change Log

- 2026-10-23: Final candidate passed native provider validation and required CI; PR #14 merged as 0bb98cb. Provider checkout confirmed clean, exact merged release with identical validated tree. Critical-vulnerability blocking independently checked in publishing UI; production publication started. A new private recovery archive/Git bundle was checksum-verified under .git/private-recovery; older external archives are unavailable in the replacement container, not claimed reverified. Recovery branches remain intact.

- 2026-10-23: Owner authorized finishing the known provider-runtime correction. Rechecked clean local branch and open PR #14, reran the full application suite and current npm audit. Provider reports its Node 24 module is now patched; replace the shadowed Nix workaround with the supported module and explicit bundled-CA policy, pending native validation and actual publication.

- 2026-10-22: Prior audit reviewed, compromise precheck completed before project execution, current baseline researched, local branch created, targeted fixes implemented and verified in isolated environment. Production sign-off intentionally remains blocked.
