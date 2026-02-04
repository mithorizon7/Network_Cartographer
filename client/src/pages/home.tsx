import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { LayerMode, Scenario, Environment, ScenarioTask, FlowCategory } from "@shared/schema";
import { scenarioIdToKey } from "@/lib/scenarioUtils";
import { useOnboardingOptional } from "@/components/OnboardingProvider";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { LayerGoggles, LayerLegend } from "@/components/LayerGoggles";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { DeviceDetailsPanel } from "@/components/DeviceDetailsPanel";
import { LearningPrompts } from "@/components/LearningPrompts";
import { TableView } from "@/components/TableView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  DeviceFilter,
  defaultFilters,
  useDeviceFilter,
  type DeviceFilters,
} from "@/components/DeviceFilter";
import { PacketJourney } from "@/components/PacketJourney";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { ScenarioExportImport } from "@/components/ScenarioExportImport";
import { EventNotifications } from "@/components/EventNotifications";
import { UnknownDeviceModal } from "@/components/UnknownDeviceModal";
import { ScenarioActions, type ActionOutcome } from "@/components/ScenarioActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  RotateCcw,
  Map as MapIcon,
  TableIcon,
  Info,
  AlertCircle,
  Loader2,
  Zap,
  GitCompare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ScenarioSummary {
  id: string;
  title: string;
  description: string;
  environment: { type: string; isp: string; publicIp: string };
  deviceCount: number;
  networkCount: number;
}

export default function Home() {
  const { t } = useTranslation();
  const onboarding = useOnboardingOptional();
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerMode>("network");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [filters, setFilters] = useState<DeviceFilters>(defaultFilters);
  const [showPacketJourney, setShowPacketJourney] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [importedScenario, setImportedScenario] = useState<Scenario | null>(null);
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [actionsResetKey, setActionsResetKey] = useState(0);
  const [showFullMac, setShowFullMac] = useState(true);
  const [activeTask, setActiveTask] = useState<ScenarioTask | null>(null);
  const [actionOutcome, setActionOutcome] = useState<ActionOutcome | null>(null);
  const [showSelectedFlowsOnly, setShowSelectedFlowsOnly] = useState(false);

  const {
    data: scenarioSummaries,
    isLoading: isLoadingList,
    error: listError,
  } = useQuery<ScenarioSummary[]>({
    queryKey: ["/api/scenarios"],
  });

  const {
    data: scenario,
    isLoading: isLoadingScenario,
    error: scenarioError,
  } = useQuery<Scenario>({
    queryKey: ["/api/scenarios", selectedScenarioId],
    enabled: !!selectedScenarioId,
  });

  useEffect(() => {
    if (scenarioSummaries && scenarioSummaries.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(scenarioSummaries[0].id);
    }
  }, [scenarioSummaries, selectedScenarioId]);

  useEffect(() => {
    if (!onboarding?.isActive) return;
    if (viewMode !== "map") {
      setViewMode("map");
    }
  }, [onboarding?.isActive, viewMode]);

  useEffect(() => {
    if (!actionOutcome) return;
    const timer = setTimeout(() => setActionOutcome(null), 5000);
    return () => clearTimeout(timer);
  }, [actionOutcome]);

  const activeScenario = importedScenario || scenario;
  const scenarioKey = activeScenario ? scenarioIdToKey[activeScenario.id] : null;

  const selectedDevice = activeScenario?.devices.find((d) => d.id === selectedDeviceId) || null;
  const selectedNetwork = selectedDevice
    ? activeScenario?.networks.find((n) => n.id === selectedDevice.networkId) || null
    : null;
  const routerDevice = activeScenario?.devices.find((d) => d.type === "router") || null;

  useEffect(() => {
    if (!selectedDevice) {
      setShowSelectedFlowsOnly(false);
    }
  }, [selectedDevice]);

  useEffect(() => {
    const taskCount = activeScenario?.scenarioTasks?.length ?? 0;
    if (!activeScenario || taskCount === 0) {
      setActiveTask(null);
    }
  }, [activeScenario]);

  const filteredDevices = useDeviceFilter(
    activeScenario?.devices || [],
    activeScenario?.networks || [],
    filters,
  );

  const filteredDeviceIds = useMemo(
    () => new Set(filteredDevices.map((d) => d.id)),
    [filteredDevices],
  );

  const filteredScenario = useMemo((): Scenario | undefined => {
    if (!activeScenario) return undefined;
    return {
      ...activeScenario,
      devices: activeScenario.devices,
    };
  }, [activeScenario]);

  const selectedDeviceIdForFlows = selectedDevice?.id;
  const flowLegendCategories = useMemo(() => {
    if (!activeScenario?.flows || activeScenario.flows.length === 0) return [];
    const flows =
      showSelectedFlowsOnly && selectedDeviceIdForFlows
        ? activeScenario.flows.filter((flow) => flow.srcDeviceId === selectedDeviceIdForFlows)
        : activeScenario.flows;
    const counts = new Map<FlowCategory, number>();
    flows.forEach((flow) => {
      counts.set(flow.category, (counts.get(flow.category) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }, [activeScenario?.flows, showSelectedFlowsOnly, selectedDeviceIdForFlows]);

  const taskTargetDeviceIds = useMemo(() => {
    if (!activeScenario || !activeTask) return new Set<string>();
    if (activeTask.target.type === "device" && activeTask.target.id) {
      return new Set<string>([activeTask.target.id]);
    }
    if (activeTask.target.type === "network" && activeTask.target.id) {
      return new Set<string>(
        activeScenario.devices
          .filter((device) => device.networkId === activeTask.target.id)
          .map((device) => device.id),
      );
    }
    return new Set<string>();
  }, [activeScenario, activeTask]);

  const filtersActive =
    filters.searchQuery ||
    filters.deviceTypes.length > 0 ||
    filters.networkZones.length > 0 ||
    filters.showRisksOnly;
  const targetHiddenByFilters = useMemo(() => {
    if (!activeScenario || taskTargetDeviceIds.size === 0) return false;
    const targetExists = activeScenario.devices.some((device) =>
      taskTargetDeviceIds.has(device.id),
    );
    if (!targetExists || !filtersActive) return false;
    const targetVisible = filteredDevices.some((device) => taskTargetDeviceIds.has(device.id));
    return !targetVisible;
  }, [activeScenario, filteredDevices, taskTargetDeviceIds, filtersActive]);

  const highlightZone = useMemo(() => {
    if (!actionOutcome || !activeScenario) return null;
    if (actionOutcome.target.type === "network" && actionOutcome.target.id) {
      const network = activeScenario.networks.find((n) => n.id === actionOutcome.target.id);
      return network?.zone || null;
    }
    return null;
  }, [actionOutcome, activeScenario]);

  const flashDeviceIds = useMemo(() => {
    if (!actionOutcome || actionOutcome.target.type !== "device" || !actionOutcome.target.id)
      return undefined;
    return new Set([actionOutcome.target.id]);
  }, [actionOutcome]);

  const dimmedDeviceIds = useMemo(() => {
    if (
      !actionOutcome ||
      actionOutcome.actionType !== "block_unknown" ||
      actionOutcome.target.type !== "device" ||
      !actionOutcome.target.id
    )
      return undefined;
    return new Set([actionOutcome.target.id]);
  }, [actionOutcome]);

  const scenarioBriefBody = activeScenario
    ? scenarioKey
      ? t(`scenarioBrief.${scenarioKey}.body`, { defaultValue: activeScenario.description })
      : activeScenario.description
    : "";
  const scenarioWatchFor = scenarioKey
    ? t(`scenarioBrief.${scenarioKey}.watchFor`, { defaultValue: "" })
    : "";
  const showFlowInfo = activeLayer === "transport" || activeLayer === "application";
  const disableAdvancedViews = onboarding?.isActive;
  const tasksInProgress = !!activeTask;
  const showInlineUnknown =
    !!selectedDevice &&
    (selectedDevice.type === "unknown" || selectedDevice.riskFlags.includes("unknown_device")) &&
    tasksInProgress;
  const hasScenarioTasks = (activeScenario?.scenarioTasks?.length ?? 0) > 0;

  const handleReset = useCallback(() => {
    setSelectedDeviceId(null);
    setFilters(defaultFilters);
    setShowPacketJourney(false);
    setShowComparison(false);
    setImportedScenario(null);
    setActionOutcome(null);
    setActiveTask(null);
    setActionsResetKey((prev) => prev + 1);
  }, []);

  const handleScenarioChange = useCallback((id: string) => {
    setSelectedScenarioId(id);
    setSelectedDeviceId(null);
    setFilters(defaultFilters);
    setShowPacketJourney(false);
    setImportedScenario(null);
    setActionOutcome(null);
    setActiveTask(null);
    setActionsResetKey((prev) => prev + 1);
  }, []);

  const handleTogglePacketJourney = useCallback(() => {
    setShowPacketJourney((prev) => !prev);
  }, []);

  const handleShowUnknownDetails = useCallback(() => {
    setShowUnknownModal(true);
  }, []);

  const handleImportScenario = useCallback((imported: Scenario) => {
    setImportedScenario(imported);
    setSelectedDeviceId(null);
    setFilters(defaultFilters);
    setShowPacketJourney(false);
    setShowComparison(false);
    setActionOutcome(null);
    setActiveTask(null);
    setActionsResetKey((prev) => prev + 1);
  }, []);

  const handleDeviceSelect = useCallback(
    (deviceId: string) => {
      setSelectedDeviceId(deviceId);
      const device = activeScenario?.devices.find((d) => d.id === deviceId);
      if (device && (device.type === "unknown" || device.riskFlags.includes("unknown_device"))) {
        if (activeTask) {
          setShowUnknownModal(false);
        } else {
          setShowUnknownModal(true);
        }
      }
      if (onboarding?.isActive && onboarding.currentStep?.id === "device_inspection") {
        onboarding.satisfyGating();
      }
    },
    [activeScenario, onboarding, activeTask],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedDeviceId(null);
      }
      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== "INPUT" && activeElement?.tagName !== "TEXTAREA") {
          handleReset();
        }
      }
      if (e.key >= "1" && e.key <= "4" && !e.metaKey && !e.ctrlKey) {
        const activeElement = document.activeElement;
        if (activeElement?.tagName !== "INPUT" && activeElement?.tagName !== "TEXTAREA") {
          const layers: LayerMode[] = ["link", "network", "transport", "application"];
          const index = parseInt(e.key) - 1;
          if (layers[index]) {
            setActiveLayer(layers[index]);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleReset]);

  const scenariosForSelector =
    scenarioSummaries?.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      environment: s.environment as Environment,
      networks: [],
      devices: [],
      events: [],
      learningPrompts: [],
      scenarioTasks: [],
      flows: [],
    })) || [];

  const isLoading = isLoadingList || (selectedScenarioId && isLoadingScenario);
  const error = listError || scenarioError;

  const statusStack =
    showInlineUnknown || actionOutcome ? (
      <div className="space-y-2">
        {showInlineUnknown && (
          <Card
            className="border-destructive/40 bg-destructive/5"
            data-testid="inline-unknown-device"
          >
            <CardContent className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                    {t("unknownDevice.inlineTitle")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("unknownDevice.inlineBody")}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={handleShowUnknownDetails}>
                  {t("unknownDevice.viewDetails")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {actionOutcome && (
          <Card className="border-green-500/30 bg-green-500/5" data-testid="action-outcome-banner">
            <CardContent className="px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600">
                {t("actions.outcomeTitle")}
              </p>
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                {actionOutcome.message}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    ) : null;

  const devicePanel = selectedDevice ? (
    <DeviceDetailsPanel
      device={selectedDevice}
      network={selectedNetwork}
      activeLayer={activeLayer}
      onClose={() => setSelectedDeviceId(null)}
      showFullMac={showFullMac}
      onToggleMacDisplay={setShowFullMac}
    />
  ) : (
    <Card className="p-4" data-testid="panel-device-collapsed">
      <p className="text-sm font-medium">{t("devicePanel.noDeviceSelected")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("devicePanel.clickToSelect")}</p>
    </Card>
  );

  const packetJourneyCard =
    selectedDevice && selectedDevice.type !== "router" ? (
      <Card className="p-4">
        {showPacketJourney ? (
          <PacketJourney
            sourceDevice={selectedDevice}
            routerDevice={routerDevice}
            activeLayer={activeLayer}
            publicIp={activeScenario?.environment.publicIp || "0.0.0.0"}
            flows={activeScenario?.flows || []}
            onClose={() => setShowPacketJourney(false)}
            showFullMac={showFullMac}
          />
        ) : (
          <div className="text-center">
            <Zap className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="mb-3 text-sm text-muted-foreground">
              {t("common.tracePacketJourneyDescription")}
            </p>
            <Button
              size="sm"
              onClick={handleTogglePacketJourney}
              data-testid="button-start-packet-journey"
            >
              <Zap className="mr-1.5 h-4 w-4" />
              {t("common.tracePacketJourney")}
            </Button>
          </div>
        )}
      </Card>
    ) : null;

  const learningSection =
    activeScenario && activeScenario.learningPrompts.length > 0 ? (
      <LearningPrompts prompts={activeScenario.learningPrompts} />
    ) : null;

  const scenarioBriefCard = activeScenario ? (
    <Card data-testid="scenario-brief" className="border-primary/15 bg-primary/5">
      <CardContent className="pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {t("scenarioBrief.title")}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{scenarioBriefBody}</p>
        {scenarioWatchFor && (
          <div className="mt-3 rounded-md border border-primary/20 bg-card px-3 py-2 text-xs">
            <span className="font-semibold">{t("scenarioBrief.watchForLabel")}:</span>{" "}
            {scenarioWatchFor}
          </div>
        )}
      </CardContent>
    </Card>
  ) : null;

  const secondarySection =
    learningSection || scenarioBriefCard ? (
      <div className="space-y-4 border-t border-border/70 pt-4">
        {scenarioBriefCard}
        {learningSection}
      </div>
    ) : null;

  return (
    <div className="app-shell flex h-screen flex-col overflow-x-hidden" data-testid="page-home">
      <header className="app-header">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark">
              <MapIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <h1 className="app-title">{t("app.title")}</h1>
              <p className="app-subtitle hidden sm:block">{t("app.subtitle")}</p>
            </div>
          </div>

          <div className="header-deck">
            {isLoadingList ? (
              <Skeleton className="h-9 w-[280px] rounded-full" />
            ) : (
              <ScenarioSelector
                scenarios={scenariosForSelector}
                selectedId={selectedScenarioId}
                onSelect={handleScenarioChange}
              />
            )}

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  data-testid="button-info"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="app-dialog max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t("app.title")}</DialogTitle>
                  <DialogDescription>{t("app.subtitle")}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p>{t("info.about")}</p>
                  <div>
                    <h4 className="mb-2 font-medium">{t("layers.title")}</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>
                        <span className="font-medium text-foreground">{t("layers.link")}:</span>{" "}
                        {t("layers.linkDescription")}
                      </li>
                      <li>
                        <span className="font-medium text-foreground">{t("layers.network")}:</span>{" "}
                        {t("layers.networkDescription")}
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          {t("layers.transport")}:
                        </span>{" "}
                        {t("layers.transportDescription")}
                      </li>
                      <li>
                        <span className="font-medium text-foreground">
                          {t("layers.application")}:
                        </span>{" "}
                        {t("layers.applicationDescription")}
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">{t("info.keyboardShortcuts")}</h4>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>
                        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">1-4</kbd>{" "}
                        {t("info.switchLayers")}
                      </li>
                      <li>
                        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Esc</kbd>{" "}
                        {t("info.deselectDevice")}
                      </li>
                      <li>
                        <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">R</kbd>{" "}
                        {t("common.reset")}
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onboarding?.restartOnboarding()}
                      data-testid="button-replay-tour"
                      disabled={!onboarding}
                    >
                      {t("onboarding.replayTour")}
                    </Button>
                    {onboarding?.isActive && (
                      <span className="text-xs text-muted-foreground">
                        {t("onboarding.mapOnlyNotice")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t("info.allNetworksFictional")}</p>
                </div>
              </DialogContent>
            </Dialog>

            <div className="h-6 w-px bg-border/80" aria-hidden="true" />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-5 overflow-hidden px-5 pb-5 pt-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="control-deck reveal">
            <LayerGoggles activeLayer={activeLayer} onChange={setActiveLayer} />

            <div className="flex flex-wrap items-center gap-2">
              <div className="segmented-control">
                <Button
                  variant={viewMode === "map" && !showComparison ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setViewMode("map");
                    setShowComparison(false);
                  }}
                  data-testid="button-view-map"
                >
                  <MapIcon className="mr-1.5 h-4 w-4" />
                  {t("controls.mapView")}
                </Button>
                <Button
                  variant={viewMode === "table" && !showComparison ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setViewMode("table");
                    setShowComparison(false);
                  }}
                  data-testid="button-view-table"
                  disabled={disableAdvancedViews}
                  title={disableAdvancedViews ? t("onboarding.mapOnlyNotice") : undefined}
                >
                  <TableIcon className="mr-1.5 h-4 w-4" />
                  {t("controls.tableView")}
                </Button>
                <Button
                  variant={showComparison ? "default" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setShowComparison(true)}
                  data-testid="button-view-compare"
                  disabled={
                    disableAdvancedViews || !scenarioSummaries || scenarioSummaries.length < 2
                  }
                  title={disableAdvancedViews ? t("onboarding.mapOnlyNotice") : undefined}
                >
                  <GitCompare className="mr-1.5 h-4 w-4" />
                  {t("controls.compare")}
                </Button>
              </div>

              {!onboarding?.isActive && (
                <ScenarioExportImport
                  scenario={activeScenario || null}
                  onImport={handleImportScenario}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={handleReset}
                data-testid="button-reset"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                {t("common.reset")}
              </Button>
            </div>
          </div>

          {activeScenario && (
            <div className="reveal reveal-delay-1 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 shadow-sm backdrop-blur">
              <DeviceFilter
                devices={activeScenario.devices}
                networks={activeScenario.networks}
                filters={filters}
                onFiltersChange={setFilters}
              />
            </div>
          )}

          <Card className="map-panel reveal reveal-delay-2 flex-1 overflow-hidden">
            {showComparison && scenarioSummaries ? (
              <ScenarioComparison
                scenarios={scenarioSummaries.map((s) => ({ id: s.id, title: s.title }))}
                onClose={() => setShowComparison(false)}
              />
            ) : error ? (
              <div
                className="flex h-full items-center justify-center text-destructive"
                data-testid="error-state"
              >
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-70" />
                  <p className="font-medium">{t("common.failedToLoadScenario")}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{t("common.tryRefresh")}</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex h-full items-center justify-center" data-testid="loading-state">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin opacity-50" />
                  <p className="text-sm">{t("common.loadingNetwork")}</p>
                </div>
              </div>
            ) : filteredScenario ? (
              viewMode === "map" ? (
                <NetworkCanvas
                  scenario={filteredScenario}
                  activeLayer={activeLayer}
                  selectedDeviceId={selectedDeviceId}
                  onDeviceSelect={handleDeviceSelect}
                  highlightedDeviceIds={filteredDeviceIds}
                  showFullMac={showFullMac}
                  flashDeviceIds={flashDeviceIds}
                  dimmedDeviceIds={dimmedDeviceIds}
                  highlightZone={highlightZone || undefined}
                  flowFilterDeviceId={showSelectedFlowsOnly ? selectedDevice?.id || null : null}
                />
              ) : (
                <div className="flex h-full flex-col">
                  {targetHiddenByFilters && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-chart-5/5 px-4 py-2 text-xs text-muted-foreground">
                      <span>{t("tableView.filtersHideTarget")}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setFilters(defaultFilters)}
                      >
                        {t("tableView.clearFilters")}
                      </Button>
                    </div>
                  )}
                  <TableView
                    devices={filteredDevices}
                    networks={activeScenario?.networks || []}
                    activeLayer={activeLayer}
                    selectedDeviceId={selectedDeviceId}
                    onDeviceSelect={handleDeviceSelect}
                    showFullMac={showFullMac}
                    highlightedDeviceIds={taskTargetDeviceIds}
                  />
                </div>
              )
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MapIcon className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>{t("common.selectScenarioToBegin")}</p>
                </div>
              </div>
            )}
          </Card>

          <div className="legend-bar reveal reveal-delay-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <LayerLegend
                activeLayer={activeLayer}
                flowCategories={flowLegendCategories}
                showFullMac={showFullMac}
              />
              {showFlowInfo && (
                <div
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                  title={t("legend.flowInfoBody")}
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>{t("legend.flowInfoTitle")}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showFlowInfo && selectedDevice && (
                <div className="flex items-center gap-2 rounded-full border border-border/80 bg-card/70 px-3 py-1 text-xs shadow-sm">
                  <span>{t("legend.showSelectedFlows")}</span>
                  <Switch
                    checked={showSelectedFlowsOnly}
                    onCheckedChange={setShowSelectedFlowsOnly}
                    aria-label={t("legend.showSelectedFlows")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="side-panel reveal reveal-delay-2 flex h-80 w-full flex-col gap-4 lg:h-auto lg:w-96">
          <ScrollArea className="flex-1 pr-2">
            <div className="space-y-4 pr-2">
              {statusStack}

              <div className="space-y-4">
                {activeScenario && hasScenarioTasks && (
                  <ScenarioActions
                    scenario={activeScenario}
                    selectedDevice={selectedDevice}
                    resetKey={actionsResetKey}
                    onTaskChange={(task, isComplete) => setActiveTask(isComplete ? null : task)}
                    onActionComplete={setActionOutcome}
                  />
                )}

                {devicePanel}
                {packetJourneyCard}
              </div>

              {secondarySection}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {activeScenario && activeScenario.description && (
        <footer className="app-footer px-5 py-3">
          <p className="text-center text-xs text-muted-foreground">
            {scenarioIdToKey[activeScenario.id]
              ? t(`scenarioContent.${scenarioIdToKey[activeScenario.id]}.description`, {
                  defaultValue: activeScenario.description,
                })
              : activeScenario.description}
          </p>
        </footer>
      )}

      {activeScenario && (
        <EventNotifications
          events={activeScenario.events}
          devices={activeScenario.devices}
          scenarioId={activeScenario.id}
          selectedDeviceId={selectedDeviceId}
        />
      )}

      <UnknownDeviceModal
        device={
          selectedDevice &&
          (selectedDevice.type === "unknown" || selectedDevice.riskFlags.includes("unknown_device"))
            ? selectedDevice
            : null
        }
        isOpen={showUnknownModal}
        onClose={() => setShowUnknownModal(false)}
        showFullMac={showFullMac}
      />
    </div>
  );
}
