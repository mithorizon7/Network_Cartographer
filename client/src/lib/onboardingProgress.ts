export interface GuidedStep {
  id: string;
  gatingAction?: string;
  targetSelector?: string;
  completedTargetSelector?: string;
  compactTargetSelector?: string;
  completedCompactTargetSelector?: string;
}

interface GuidedProgress {
  completed: boolean;
  currentStep: number;
}

export function isGuidedStepReady(step: GuidedStep | null, completed: ReadonlySet<string>) {
  return !step?.gatingAction || completed.has(step.id);
}

export function getGuidedTarget(step: GuidedStep, completed: ReadonlySet<string>, compact = false) {
  const target = compact
    ? (step.compactTargetSelector ?? step.targetSelector)
    : step.targetSelector;
  return isGuidedStepReady(step, completed)
    ? ((compact ? step.completedCompactTargetSelector : undefined) ??
        step.completedTargetSelector ??
        target)
    : target;
}

export function advanceGuidedProgress<T extends GuidedProgress>(
  progress: T,
  expectedStep: number,
  steps: readonly GuidedStep[],
  completed: ReadonlySet<string>,
): T {
  const step = steps[progress.currentStep];
  if (progress.currentStep !== expectedStep || !step || !isGuidedStepReady(step, completed)) {
    return progress;
  }
  return progress.currentStep === steps.length - 1
    ? { ...progress, completed: true }
    : { ...progress, currentStep: progress.currentStep + 1 };
}
