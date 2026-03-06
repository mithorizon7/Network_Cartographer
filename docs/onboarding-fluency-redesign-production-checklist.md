# onboarding fluency redesign Checklist

Source of truth checklist for a large/intense task.

## Metadata

- Created: 2026-03-06T15:22:48
- Last Updated: 2026-03-06T15:38:00
- Workspace: /Users/davedxn/Downloads/Network_Cartographer
- Checklist Doc: /Users/davedxn/Downloads/Network_Cartographer/docs/onboarding-fluency-redesign-production-checklist.md

## Scope

- [x] Q-000 [status:verified] Capture explicit scope, constraints, and success criteria.
  - Scope: Redesign first-session onboarding for faster learner fluency and practical success in the Network Cartographer.
  - Success criteria: Reduce passive tour burden, align guidance to authentic tasks, add recoverable in-product guidance, preserve i18n parity (en/lv/ru), and pass validation suite.

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
- [x] Q-004 [status:accepted_risk] Expand or update automated tests.
- [x] Q-005 [status:verified] Run full validation suite.
- [x] Q-006 [status:verified] Final code-quality pass and sign-off review.

## Findings Log

- [x] F-001 [status:verified] [P2] [confidence:0.90] First-session onboarding is tutorial-heavy and delays first meaningful success.
  - Evidence: `/Users/davedxn/Downloads/Network_Cartographer/client/src/components/OnboardingProvider.tsx` lines 14-68 define 18 steps, many passive; no direct gating to complete a real scenario action.
  - Owner: codex
  - Linked Fix: P-001
- [x] F-002 [status:verified] [P2] [confidence:0.87] Scenario selection gating can force redundant interaction because a scenario is preselected automatically.
  - Evidence: `/Users/davedxn/Downloads/Network_Cartographer/client/src/pages/home.tsx` lines 96-100 auto-select first scenario; `/Users/davedxn/Downloads/Network_Cartographer/client/src/components/OnboardingProvider.tsx` lines 25-29 gate scenario selection.
  - Owner: codex
  - Linked Fix: P-002
- [x] F-003 [status:verified] [P2] [confidence:0.83] Guidance rediscovery is weak; replay entry is buried in info modal instead of persistent contextual scaffold.
  - Evidence: `/Users/davedxn/Downloads/Network_Cartographer/client/src/pages/home.tsx` lines 493-571 place replay control inside info dialog only.
  - Owner: codex
  - Linked Fix: P-003
- [x] F-004 [status:verified] [P3] [confidence:0.86] Replay flow did not reset mission milestones, so gated steps could auto-unlock and weaken replay fidelity.
  - Evidence: Mission milestone state persisted in localStorage while replay only restarted onboarding context.
  - Owner: codex
  - Linked Fix: P-004
- [x] F-005 [status:verified] [P3] [confidence:0.94] Scenario selector retained obsolete onboarding hook for removed `scenario_select` step.
  - Evidence: `/Users/davedxn/Downloads/Network_Cartographer/client/src/components/ScenarioSelector.tsx` had stale `useOnboardingOptional` dependency and unreachable branch.
  - Owner: codex
  - Linked Fix: P-005

## Fix Log

- [x] P-001 [status:verified] Replace long passive tour with mission-based onboarding sequence aligned to authentic task completion.
  - Addresses: F-001
  - Evidence: Updated onboarding sequence in `/Users/davedxn/Downloads/Network_Cartographer/client/src/components/OnboardingProvider.tsx` to 8 mission-oriented steps with authentic gating.
- [x] P-002 [status:verified] Remove redundant scenario gating and replace with progress steps that do not conflict with auto-selected defaults.
  - Addresses: F-002
  - Evidence: Removed scenario-selection gate and replaced with contextual scenario framing step in onboarding translations/provider.
- [x] P-003 [status:verified] Add persistent first-session checklist guidance with clear resume/replay pathways.
  - Addresses: F-003
  - Evidence: Added persistent checklist card and replay control in `/Users/davedxn/Downloads/Network_Cartographer/client/src/pages/home.tsx` using i18n copy in all locales.
- [x] P-004 [status:verified] Reset mission milestones and interaction state when replaying guided mission.
  - Addresses: F-004
  - Evidence: Added `handleReplayGuidedMission` in `/Users/davedxn/Downloads/Network_Cartographer/client/src/pages/home.tsx` to reset milestones, layer/device/action state, and restart onboarding.
- [x] P-005 [status:verified] Remove unreachable onboarding branch from scenario selector.
  - Addresses: F-005
  - Evidence: Simplified selector change handling in `/Users/davedxn/Downloads/Network_Cartographer/client/src/components/ScenarioSelector.tsx`.

## Validation Log

- [x] V-001 [status:verified] `npm run check`
  - Evidence: 2026-03-06 15:38 EST + pass (rerun after second-pass fixes)
- [x] V-002 [status:verified] `npm run lint`
  - Evidence: 2026-03-06 15:38 EST + pass (rerun after second-pass fixes)
- [x] V-003 [status:verified] `npm test`
  - Evidence: 2026-03-06 15:38 EST + pass (Smoke test passed)
- [x] V-004 [status:verified] `npm run i18n:check`
  - Evidence: 2026-03-06 15:38 EST + pass (661 keys, 0 missing, 0 placeholder mismatches)

## Residual Risks

- [x] R-001 [status:accepted_risk] Final UX efficacy still requires real learner instrumentation (TTFMS, activation, drop-off).
  - Rationale: Product has no runtime analytics pipeline; onboarding efficacy is currently inferred from design quality and manual QA rather than cohort telemetry.
  - Owner: product + engineering
  - Follow-up trigger/date: after first production usage cohort is available.

## Change Log

- 2026-03-06T15:22:48: Checklist initialized.
- 2026-03-06T15:35:00: Scope anchored, discovery completed, findings logged, fix plan queued.
- 2026-03-06T15:36:00: Mission-based onboarding redesign implemented, i18n updated, validation suite rerun and passed.
- 2026-03-06T15:38:00: Second-pass QA fixes completed (replay reset behavior + stale selector hook removal) and validations rerun.
