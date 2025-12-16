import type { Scenario } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Home, Building2, Wifi } from "lucide-react";

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
  return (
    <Select value={selectedId ?? ""} onValueChange={onSelect}>
      <SelectTrigger className="w-full min-w-[200px] sm:w-[280px]" data-testid="select-scenario">
        <SelectValue placeholder="Select a scenario..." />
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
                <span>{scenario.title}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
