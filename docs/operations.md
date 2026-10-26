# Network Cartographer Operations

Owner: repository and Replit account `mithorizon7`. Reviewed October 26, 2026.

## Service Identity

- Source: [mithorizon7/Network_Cartographer](https://github.com/mithorizon7/Network_Cartographer), protected `main`.
- Live service: [networkcartographer.replit.app](https://networkcartographer.replit.app).
- Replit project: [Network Cartographer](https://replit.com/@mithorizon7/Network-Cartographer), ID `aff19e5e-883a-4a41-badf-9e88bb454182`.
- Deployment ID: `446da10e-7551-4aef-89e1-410ddf07338d`. Current artifact, source commit and verification evidence are recorded in [the audit report](security-audit-2026-10-22.md).
- This is a fictional-network learning simulator, not a network scanner. Its API is public and read-only. Imported scenarios stay in the browser; do not use real credentials, personal network inventories or private information in shared exports.

## Alerts and Routine Checks

In Replit, open Publishing > Adjust settings > Suggested add-ons. Monitoring alerts were enabled October 26; Auto-fix remains off. Uptime-email notifications were selected for the next authorized publication and must be confirmed after publication. Critical-vulnerability publishing protection remains on. No plan upgrade, automatic code repair, automatic republishing, analytics or feedback widget was enabled.

These controls do not prove email delivery or continuous service availability. Use the existing account's notification preferences to confirm the intended recipient without copying addresses into public logs. Review actual alert delivery when the first genuine alert arrives; do not deliberately break production to generate one. Replit's [monitoring documentation](https://docs.replit.com/features/publishing/monitoring-agent) describes separate alert, repair and republishing controls.

The owner should inspect Monitoring and production logs after each release, after an alert, and before a workshop. Check availability, repeated 5xx, startup failures, latency and resource pressure. An Autoscale termination alone is not evidence of an application crash or security incident; correlate it with failed requests and subsequent startup. The October 25-26 inspection found transient startup healthcheck failures followed by successful serving and one SIGTERM of unknown cause; no root cause is established by those records.

Dependabot already checks npm and GitHub Actions weekly. Review its PRs and advisories promptly, especially security updates. Do not auto-merge major dependency groups or suppress audit failures. Both production and full dependency audits are required CI gates. This closeout does not create a new scheduled agent or paid monitoring service.

## Release and Verification

1. Use the repository's pinned patched Node runtime, not an old global default. Preserve existing work and recovery references. Create a branch and a pull request; do not bypass protected `main`.
2. Clean-install with lifecycle scripts disabled. Run the complete required CI suite, including import, onboarding, security, translation and production-artifact checks. Review the diff. The Linux deployment bootstrap verifies the pinned runtime archive checksum, audits dependencies and builds with dev tools explicitly included.
3. Synchronize the exact approved source into Replit, preserving its existing history and recovery references. Confirm a clean checkout and a tree matching the approved commit. Validate natively before publishing; a development preview is not production proof.
4. Publish using the existing deployment settings and security gate. Record the source commit, build ID, scan outcome, publication result and current-serving runtime startup marker. Do not weaken TLS, runtime or audit guards to get a build through.
5. From a clean checkout of that release, run `npm ci --ignore-scripts`, `npm run build`, then `npm run verify:deployment`. The verification command makes 13 bounded requests to the canonical public URL and compares its actual JS/CSS SHA256 values with local `dist`. A mismatch or failure is a failed release check, not a reason to accept stale bytes. It is not a load test or continuous uptime monitor.
6. Verify the public first-session workflow and the changed paths with ordinary browser interactions. Confirm narrow-screen controls, feedback and dismissal, EN/LV/RU labels, and no console errors. Save private evidence outside Git. Confirm alert settings persisted after publication.

## Incident and Recovery

1. For an alert, first confirm the public endpoint and inspect the matching production logs. Record UTC time, build/source identity, affected path/status and redacted symptoms. Never publish credentials, private exports or raw secret-bearing logs.
2. If a release regression is confirmed, preserve current source, logs and recovery references before changing anything. Use a reviewed corrective PR when possible. Recovery checkpoints in the editor restore workspace source, not automatically the serving deployment.
3. For emergency rollback, choose a previously reviewed artifact or source that still passes today's runtime and dependency security gates. Rebuild and explicitly republish it through the existing deployment. Do not blindly restore the October 23 Zod-vulnerable lockfile or an old runtime. Repeat the public byte/HTTP and browser checks before declaring recovery.
4. Escalate provider-specific outages or suspected infrastructure incidents to the owner/provider using captured evidence. Credential rotation, access changes, purchases and third-party incident communications require explicit owner approval. If actual exposure is established, follow the conditional incident-response section in the audit report; missing logs do not establish absence of compromise.

Existing Replit Git recovery branches and private bundles were preserved. Their availability depends on the provider container; older external temporary archives were unavailable during the earlier recovery and are not represented as verified backups. The public GitHub repository provides source history, not a backup of private runtime configuration or secrets.

## Closeout Boundary

The owner explicitly excluded a real non-technical learner pilot. Browser viewport checks are not physical iOS/Android tests, and technical success does not establish novice learning outcomes. No independent penetration test or whole-provider security certification is claimed. Provider kernel/edge patch attestations, independent production CA inventory, supporting infrastructure and historical incident evidence remain the external follow-up `R-001` in [the living checklist](security-audit-2026-10-22-checklist.md).
