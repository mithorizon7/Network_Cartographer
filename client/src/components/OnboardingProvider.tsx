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
  { id: "welcome_hook", chapter: 1, isModal: true },
  { id: "welcome_challenge", chapter: 1, isModal: true },
  { id: "welcome_mission", chapter: 1, isModal: true },

  { id: "map_solar_system", chapter: 2, targetSelector: "[data-testid='network-canvas']" },
  { id: "map_trust_zones", chapter: 2, targetSelector: "[data-testid='network-canvas']" },
  { id: "map_device_indicators", chapter: 2, targetSelector: "[data-testid='network-canvas']" },

  { id: "scenario_contexts", chapter: 3, targetSelector: "[data-testid='scenario-selector']" },
  {
    id: "scenario_select",
    chapter: 3,
    targetSelector: "[data-testid='scenario-selector']",
    gatingAction: "onboarding.gating.selectScenario",
  },

  { id: "layers_why", chapter: 4, targetSelector: "[data-testid='layer-goggles']" },
  {
    id: "layers_link",
    chapter: 4,
    targetSelector: "[data-testid='layer-button-link']",
    gatingAction: "onboarding.gating.clickLink",
  },
  {
    id: "layers_network",
    chapter: 4,
    targetSelector: "[data-testid='layer-button-network']",
    gatingAction: "onboarding.gating.clickNetwork",
  },
  {
    id: "layers_transport",
    chapter: 4,
    targetSelector: "[data-testid='layer-button-transport']",
    gatingAction: "onboarding.gating.clickTransport",
  },
  {
    id: "layers_application",
    chapter: 4,
    targetSelector: "[data-testid='layer-button-application']",
    gatingAction: "onboarding.gating.clickApplication",
  },

  {
    id: "device_inspection",
    chapter: 5,
    targetSelector: "[data-testid='network-canvas']",
    gatingAction: "onboarding.gating.clickDevice",
  },
  { id: "device_risk_flags", chapter: 5, targetSelector: "[data-testid='device-details-panel']" },
  { id: "device_learn_tab", chapter: 5, targetSelector: "[data-testid='tab-learn']" },

  { id: "quiz_intro", chapter: 6, targetSelector: "[data-testid='learning-prompts']" },
  { id: "mission_complete", chapter: 6, isModal: true },
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
        return JSON.parse(stored);
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

  const showPrev = state.currentStep > 2;
  const showSkip = state.currentStep >= 2;

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
              : state.currentStep < 3
                ? t("onboarding.buttons.continue")
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
