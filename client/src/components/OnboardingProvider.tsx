import { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SpotlightOverlay } from "./SpotlightOverlay";

export interface OnboardingStep {
  id: string;
  chapter: number;
  targetSelector?: string;
  isModal?: boolean;
  gatingAction?: string;
  gatingCheck?: () => boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  { id: "welcome_mission", chapter: 1, isModal: true },
  { id: "scenario_context", chapter: 2, targetSelector: "[data-testid='scenario-selector']" },
  { id: "map_scan", chapter: 3, targetSelector: "[data-testid='network-canvas']" },
  {
    id: "layer_toggle",
    chapter: 4,
    targetSelector: "[data-testid='layer-goggles']",
    gatingAction: "onboarding.gating.toggleLayer",
  },
  {
    id: "device_inspection",
    chapter: 5,
    targetSelector: "[data-testid='network-canvas']",
    gatingAction: "onboarding.gating.clickDevice",
  },
  { id: "action_panel", chapter: 6, targetSelector: "[data-testid='scenario-actions']" },
  {
    id: "complete_first_action",
    chapter: 6,
    targetSelector: "[data-testid='scenario-actions']",
    gatingAction: "onboarding.gating.completeAction",
  },
  {
    id: "quiz_answer",
    chapter: 7,
    targetSelector: "[data-testid='learning-prompts']",
    gatingAction: "onboarding.gating.answerPrompt",
  },
  { id: "mission_complete", chapter: 7, isModal: true },
];

const STORAGE_KEY = "network-cartographer-onboarding";

interface OnboardingState {
  completed: boolean;
  currentStep: number;
  startedAt?: number;
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep | null;
  totalSteps: number;
  startOnboarding: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipOnboarding: () => void;
  completeOnboarding: () => void;
  restartOnboarding: () => void;
  hasCompletedOnboarding: boolean;
  satisfyGating: () => void;
  isGatingSatisfied: boolean;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}

interface OnboardingProviderProps {
  children: React.ReactNode;
  autoStart?: boolean;
}

export function OnboardingProvider({ children, autoStart = true }: OnboardingProviderProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<OnboardingState>;
        const parsedStep = typeof parsed.currentStep === "number" ? parsed.currentStep : 0;
        return {
          completed: !!parsed.completed,
          currentStep: parsedStep >= 0 && parsedStep < ONBOARDING_STEPS.length ? parsedStep : 0,
          startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : undefined,
        };
      }
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
    return { completed: false, currentStep: 0 };
  });

  const [isActive, setIsActive] = useState(false);
  const [isGatingSatisfied, setIsGatingSatisfied] = useState(true);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors (private mode, blocked storage, etc.)
    }
  }, [state]);

  useEffect(() => {
    if (autoStart && !state.completed && !isActive) {
      const timer = setTimeout(() => {
        setIsActive(true);
        setState((prev) => ({ ...prev, startedAt: Date.now() }));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, state.completed, isActive]);

  const currentStep = isActive ? ONBOARDING_STEPS[state.currentStep] || null : null;

  useEffect(() => {
    if (currentStep?.gatingAction) {
      setIsGatingSatisfied(false);
    } else {
      setIsGatingSatisfied(true);
    }
  }, [currentStep?.gatingAction]);

  const startOnboarding = useCallback(() => {
    setState({ completed: false, currentStep: 0, startedAt: Date.now() });
    setIsActive(true);
  }, []);

  const nextStep = useCallback(() => {
    if (state.currentStep >= ONBOARDING_STEPS.length - 1) {
      setState((prev) => ({ ...prev, completed: true }));
      setIsActive(false);
    } else {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
    }
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep > 0) {
      setState((prev) => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  }, [state.currentStep]);

  const skipOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, completed: true }));
    setIsActive(false);
  }, []);

  const completeOnboarding = useCallback(() => {
    setState((prev) => ({ ...prev, completed: true }));
    setIsActive(false);
  }, []);

  const restartOnboarding = useCallback(() => {
    setState({ completed: false, currentStep: 0, startedAt: Date.now() });
    setIsActive(true);
  }, []);

  const satisfyGating = useCallback(() => {
    setIsGatingSatisfied(true);
  }, []);

  const contextValue = useMemo<OnboardingContextValue>(
    () => ({
      isActive,
      currentStepIndex: state.currentStep,
      currentStep,
      totalSteps: ONBOARDING_STEPS.length,
      startOnboarding,
      nextStep,
      prevStep,
      skipOnboarding,
      completeOnboarding,
      restartOnboarding,
      hasCompletedOnboarding: state.completed,
      satisfyGating,
      isGatingSatisfied,
    }),
    [
      isActive,
      state.currentStep,
      state.completed,
      currentStep,
      startOnboarding,
      nextStep,
      prevStep,
      skipOnboarding,
      completeOnboarding,
      restartOnboarding,
      satisfyGating,
      isGatingSatisfied,
    ],
  );

  const showPrev = state.currentStep > 0;
  const showSkip = state.currentStep < ONBOARDING_STEPS.length - 1;

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      {isActive && currentStep && (
        <SpotlightOverlay
          targetSelector={currentStep.targetSelector}
          isModal={currentStep.isModal}
          title={t(`onboarding.steps.${currentStep.id}.title`)}
          content={t(`onboarding.steps.${currentStep.id}.content`)}
          stepNumber={state.currentStep + 1}
          totalSteps={ONBOARDING_STEPS.length}
          onNext={nextStep}
          onPrev={prevStep}
          onSkip={skipOnboarding}
          showPrev={showPrev}
          showSkip={showSkip}
          nextLabel={
            state.currentStep === ONBOARDING_STEPS.length - 1
              ? t("onboarding.buttons.finish")
              : t("onboarding.buttons.next")
          }
          prevLabel={t("onboarding.buttons.back")}
          skipLabel={t("onboarding.buttons.skip")}
          gatingAction={currentStep.gatingAction ? t(currentStep.gatingAction) : undefined}
          isGatingSatisfied={isGatingSatisfied}
        />
      )}
    </OnboardingContext.Provider>
  );
}
