import type { Scenario } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Building2, Wifi } from "lucide-react";
import { useTranslation } from "react-i18next";
import { scenarioIdToKey } from "@/lib/scenarioUtils";
import { useOnboardingOptional } from "@/components/OnboardingProvider";

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const scenarioIcons: Record<string, typeof Home> = {
  home: Home,
  business: Building2,
  public: Wifi,
};

export function ScenarioSelector({ scenarios, selectedId, onSelect }: ScenarioSelectorProps) {
  const { t } = useTranslation();
  const onboarding = useOnboardingOptional();

  const getLocalizedTitle = (scenario: Scenario): string => {
    const key = scenarioIdToKey[scenario.id];
    if (key) {
      return t(`scenarioContent.${key}.title`, { defaultValue: scenario.title });
    }
    return scenario.title;
  };

  const handleSelect = (id: string) => {
    onSelect(id);
    if (onboarding?.isActive && onboarding.currentStep?.id === "scenario_select") {
      onboarding.satisfyGating();
    }
  };

  return (
    <div data-testid="scenario-selector">
      <Select value={selectedId ?? ""} onValueChange={handleSelect}>
        <SelectTrigger
          className="w-full min-w-[200px] rounded-full border-border/80 bg-background/80 shadow-sm backdrop-blur sm:w-[280px]"
          data-testid="select-scenario"
        >
          <SelectValue placeholder={t("scenarios.selectScenario")} />
        </SelectTrigger>
        <SelectContent>
          {scenarios.map((scenario) => {
            const Icon = scenarioIcons[scenario.environment.type] || Home;
            return (
              <SelectItem
                key={scenario.id}
                value={scenario.id}
                data-testid={`select-option-${scenario.id}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{getLocalizedTitle(scenario)}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
