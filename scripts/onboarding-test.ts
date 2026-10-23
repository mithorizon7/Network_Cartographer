import assert from "node:assert/strict";
import { test } from "node:test";
import {
  advanceGuidedProgress,
  getGuidedTarget,
  isGuidedStepReady,
} from "../client/src/lib/onboardingProgress";

const steps = [
  { id: "welcome" },
  {
    id: "inspect",
    gatingAction: "inspect-device",
    targetSelector: "map",
    completedTargetSelector: "details",
    compactTargetSelector: "compact-map",
    completedCompactTargetSelector: "compact-details",
  },
  { id: "answer", gatingAction: "answer-question", targetSelector: "question" },
  { id: "finish" },
];

test("gates remain satisfied when returning to completed practice, but not in a new run", () => {
  const completed = new Set(["inspect"]);
  assert.equal(isGuidedStepReady(steps[0], completed), true);
  assert.equal(isGuidedStepReady(steps[1], completed), true);
  assert.equal(isGuidedStepReady(steps[2], completed), false);
  assert.equal(isGuidedStepReady(steps[1], new Set()), false);
  assert.equal(getGuidedTarget(steps[1], new Set()), "map");
  assert.equal(getGuidedTarget(steps[1], completed), "details");
  assert.equal(getGuidedTarget(steps[1], new Set(), true), "compact-map");
  assert.equal(getGuidedTarget(steps[1], completed, true), "compact-details");
  assert.equal(getGuidedTarget(steps[2], new Set(["answer"])), "question");
});

test("Next cannot bypass incomplete gates or reuse a stale double-click", () => {
  const progress = { completed: false, currentStep: 1, startedAt: 123 };
  assert.equal(advanceGuidedProgress(progress, 1, steps, new Set()), progress);
  const next = advanceGuidedProgress(progress, 1, steps, new Set(["inspect"]));
  assert.equal(next.currentStep, 2);
  assert.equal(next.startedAt, 123);
  assert.equal(next.completed, false);
  assert.equal(advanceGuidedProgress(next, 1, steps, new Set(["inspect", "answer"])), next);
  assert.equal(advanceGuidedProgress(next, 2, steps, new Set(["inspect"])), next);
  const finish = advanceGuidedProgress(next, 2, steps, new Set(["inspect", "answer"]));
  assert.equal(finish.currentStep, 3);
  assert.equal(advanceGuidedProgress(finish, 3, steps, new Set()).completed, true);
  assert.equal(progress.currentStep, 1);
});
