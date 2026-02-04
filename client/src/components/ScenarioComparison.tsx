import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import type { Scenario } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, GitCompare, ShieldAlert, Network, Wifi, Globe } from "lucide-react";
import { scenarioIdToKey, deviceLabelToKey } from "@/lib/scenarioUtils";

interface ScenarioComparisonProps {
  scenarios: Array<{ id: string; title: string }>;
  onClose: () => void;
}

interface ComparisonMetrics {
  deviceCount: number;
  networkCount: number;
  deviceTypes: Record<string, number>;
  riskCount: number;
  zones: string[];
  hasIoT: boolean;
  hasGuest: boolean;
}

function calculateMetrics(scenario: Scenario): ComparisonMetrics {
  const deviceTypes: Record<string, number> = {};
  let riskCount = 0;
  const zones = new Set<string>();

  scenario.devices.forEach((device) => {
    deviceTypes[device.type] = (deviceTypes[device.type] || 0) + 1;
    if (device.riskFlags.length > 0) riskCount++;
  });

  scenario.networks.forEach((network) => {
    zones.add(network.zone);
  });

  return {
    deviceCount: scenario.devices.length,
    networkCount: scenario.networks.length,
    deviceTypes,
    riskCount,
    zones: Array.from(zones),
    hasIoT: zones.has("iot"),
    hasGuest: zones.has("guest"),
  };
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-3 shadow-sm backdrop-blur ${
        highlight ? "border-primary/40 bg-primary/10" : "border-border/70 bg-card/70"
      }`}
    >
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function ScenarioPanel({ scenarioId }: { scenarioId: string | null }) {
  const { t } = useTranslation();
  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: ["/api/scenarios", scenarioId],
    enabled: !!scenarioId,
  });

  if (!scenarioId) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <GitCompare className="mx-auto mb-2 h-12 w-12 opacity-30" />
          <p className="text-sm">{t("comparison.selectScenario")}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="animate-pulse text-sm">{t("comparison.loading")}</div>
      </div>
    );
  }

  if (!scenario) {
    return (
      <div className="flex h-full items-center justify-center text-destructive">
        <p className="text-sm">{t("comparison.failedToLoad")}</p>
      </div>
    );
  }

  const metrics = calculateMetrics(scenario);

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        <div>
          <h3 className="text-lg font-semibold">
            {scenarioIdToKey[scenario.id]
              ? t(`scenarioContent.${scenarioIdToKey[scenario.id]}.title`, {
                  defaultValue: scenario.title,
                })
              : scenario.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {scenarioIdToKey[scenario.id]
              ? t(`scenarioContent.${scenarioIdToKey[scenario.id]}.description`, {
                  defaultValue: scenario.description,
                })
              : scenario.description}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="bg-card/60">
            <Network className="mr-1 h-3 w-3" />
            {t(`environmentTypes.${scenario.environment.type}`, {
              defaultValue: scenario.environment.type,
            })}
          </Badge>
          <Badge variant="outline" className="bg-card/60">
            <Globe className="mr-1 h-3 w-3" />
            {scenario.environment.isp}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricCard label={t("comparison.devices")} value={metrics.deviceCount} />
          <MetricCard label={t("comparison.networks")} value={metrics.networkCount} />
          <MetricCard
            label={t("comparison.securityRisks")}
            value={metrics.riskCount}
            highlight={metrics.riskCount > 0}
          />
          <MetricCard label={t("comparison.networkZones")} value={metrics.zones.length} />
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("comparison.networkZones")}</h4>
          <div className="flex flex-wrap gap-2">
            {metrics.zones.map((zone) => (
              <Badge
                key={zone}
                variant="secondary"
                className={
                  zone === "iot"
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : zone === "guest"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : ""
                }
              >
                <Wifi className="mr-1 h-3 w-3" />
                {t(`zones.${zone}`, zone)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">{t("comparison.deviceTypes")}</h4>
          <div className="grid grid-cols-2 gap-1 text-sm">
            {Object.entries(metrics.deviceTypes)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div
                  key={type}
                  className="flex items-center justify-between rounded-lg border border-border/70 bg-card/60 px-2 py-1"
                >
                  <span className="capitalize">{t(`deviceTypes.${type}`, type)}</span>
                  <Badge variant="outline" className="text-xs">
                    {count}
                  </Badge>
                </div>
              ))}
          </div>
        </div>

        {metrics.riskCount > 0 && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-destructive">
              <ShieldAlert className="h-4 w-4" />
              {t("comparison.devicesWithRisks")}
            </h4>
            <div className="space-y-1 text-sm">
              {scenario.devices
                .filter((d) => d.riskFlags.length > 0)
                .map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/30 bg-card/70 px-2 py-1 shadow-sm"
                  >
                    <span>
                      {deviceLabelToKey[device.label]
                        ? t(`deviceLabels.${deviceLabelToKey[device.label]}`, {
                            defaultValue: device.label,
                          })
                        : device.label}
                    </span>
                    <div className="flex gap-1">
                      {device.riskFlags.map((flag) => (
                        <Badge key={flag} variant="destructive" className="text-xs">
                          {t(`riskFlags.${flag}`, flag.replace(/_/g, " "))}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function ScenarioComparison({ scenarios, onClose }: ScenarioComparisonProps) {
  const { t } = useTranslation();
  const [leftScenarioId, setLeftScenarioId] = useState<string | null>(scenarios[0]?.id || null);
  const [rightScenarioId, setRightScenarioId] = useState<string | null>(scenarios[1]?.id || null);
  const getScenarioTitle = (scenarioId: string, fallback: string) => {
    const key = scenarioIdToKey[scenarioId];
    if (key) {
      return t(`scenarioContent.${key}.title`, { defaultValue: fallback });
    }
    return fallback;
  };

  return (
    <div className="flex h-full flex-col" data-testid="scenario-comparison">
      <div className="flex items-center justify-between border-b border-border/70 bg-card/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t("comparison.title")}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-comparison">
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center justify-center gap-4 border-b border-border/70 bg-card/70 px-4 py-3 backdrop-blur">
        <Select value={leftScenarioId || ""} onValueChange={setLeftScenarioId}>
          <SelectTrigger className="w-[200px]" data-testid="select-left-scenario">
            <SelectValue placeholder={t("scenarios.selectScenario")} />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {getScenarioTitle(s.id, s.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Badge variant="outline" className="px-3 py-1">
          <GitCompare className="mr-1 h-3 w-3" />
          {t("comparison.vs")}
        </Badge>

        <Select value={rightScenarioId || ""} onValueChange={setRightScenarioId}>
          <SelectTrigger className="w-[200px]" data-testid="select-right-scenario">
            <SelectValue placeholder={t("scenarios.selectScenario")} />
          </SelectTrigger>
          <SelectContent>
            {scenarios.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {getScenarioTitle(s.id, s.title)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 border-r border-border/70">
          <ScenarioPanel scenarioId={leftScenarioId} />
        </div>
        <div className="flex-1">
          <ScenarioPanel scenarioId={rightScenarioId} />
        </div>
      </div>
    </div>
  );
}
