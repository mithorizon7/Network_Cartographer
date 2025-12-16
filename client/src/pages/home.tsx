import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LayerMode, Device, Network, Scenario } from "@shared/schema";
import { NetworkCanvas } from "@/components/NetworkCanvas";
import { LayerGoggles, LayerLegend } from "@/components/LayerGoggles";
import { ScenarioSelector } from "@/components/ScenarioSelector";
import { DeviceDetailsPanel } from "@/components/DeviceDetailsPanel";
import { LearningPrompts } from "@/components/LearningPrompts";
import { TableView } from "@/components/TableView";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeviceFilter, defaultFilters, useDeviceFilter, type DeviceFilters } from "@/components/DeviceFilter";
import { PacketJourney } from "@/components/PacketJourney";
import { ScenarioComparison } from "@/components/ScenarioComparison";
import { ScenarioExportImport } from "@/components/ScenarioExportImport";
import { EventNotifications } from "@/components/EventNotifications";
import { UnknownDeviceModal } from "@/components/UnknownDeviceModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RotateCcw, Map, TableIcon, Info, AlertCircle, Loader2, Zap, GitCompare } from "lucide-react";
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<LayerMode>("network");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");
  const [filters, setFilters] = useState<DeviceFilters>(defaultFilters);
  const [showPacketJourney, setShowPacketJourney] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [importedScenario, setImportedScenario] = useState<Scenario | null>(null);
  const [showUnknownModal, setShowUnknownModal] = useState(false);

  const { 
    data: scenarioSummaries, 
    isLoading: isLoadingList, 
    error: listError 
  } = useQuery<ScenarioSummary[]>({
    queryKey: ["/api/scenarios"],
  });

  const { 
    data: scenario, 
    isLoading: isLoadingScenario, 
    error: scenarioError 
  } = useQuery<Scenario>({
    queryKey: ["/api/scenarios", selectedScenarioId],
    enabled: !!selectedScenarioId,
  });

  useEffect(() => {
    if (scenarioSummaries && scenarioSummaries.length > 0 && !selectedScenarioId) {
      setSelectedScenarioId(scenarioSummaries[0].id);
    }
  }, [scenarioSummaries, selectedScenarioId]);

  const activeScenario = importedScenario || scenario;

  const filteredDevices = useDeviceFilter(
    activeScenario?.devices || [],
    activeScenario?.networks || [],
    filters
  );

  const filteredDeviceIds = useMemo(() => new Set(filteredDevices.map(d => d.id)), [filteredDevices]);

  const filteredScenario = useMemo((): Scenario | undefined => {
    if (!activeScenario) return undefined;
    return {
      ...activeScenario,
      devices: activeScenario.devices,
    };
  }, [activeScenario]);

  const selectedDevice = activeScenario?.devices.find(d => d.id === selectedDeviceId) || null;
  const selectedNetwork = selectedDevice 
    ? activeScenario?.networks.find(n => n.id === selectedDevice.networkId) || null
    : null;
  const routerDevice = activeScenario?.devices.find(d => d.type === "router") || null;

  const handleReset = useCallback(() => {
    setSelectedDeviceId(null);
    setFilters(defaultFilters);
    setShowPacketJourney(false);
    setShowComparison(false);
    setImportedScenario(null);
  }, []);

  const handleScenarioChange = useCallback((id: string) => {
    setSelectedScenarioId(id);
    setSelectedDeviceId(null);
    setFilters(defaultFilters);
    setShowPacketJourney(false);
    setImportedScenario(null);
  }, []);

  const handleTogglePacketJourney = useCallback(() => {
    setShowPacketJourney(prev => !prev);
  }, []);

  const handleImportScenario = useCallback((imported: Scenario) => {
    setImportedScenario(imported);
    setSelectedDeviceId(null);
    setFilters(defaultFilters);
    setShowPacketJourney(false);
    setShowComparison(false);
  }, []);

  const handleDeviceSelect = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const device = activeScenario?.devices.find(d => d.id === deviceId);
    if (device && (device.type === "unknown" || device.riskFlags.includes("unknown_device"))) {
      setShowUnknownModal(true);
    }
  }, [activeScenario]);

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

  const scenariosForSelector = scenarioSummaries?.map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    environment: s.environment as any,
    networks: [],
    devices: [],
    events: [],
    learningPrompts: [],
  })) || [];

  const isLoading = isLoadingList || (selectedScenarioId && isLoadingScenario);
  const error = listError || scenarioError;

  return (
    <div className="flex h-screen flex-col bg-background" data-testid="page-home">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Network Cartographer</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Interactive Network Visualization</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoadingList ? (
            <Skeleton className="h-9 w-[280px]" />
          ) : (
            <ScenarioSelector
              scenarios={scenariosForSelector}
              selectedId={selectedScenarioId}
              onSelect={handleScenarioChange}
            />
          )}
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="button-info">
                <Info className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>About Network Cartographer</DialogTitle>
                <DialogDescription>
                  Learn how networks work through interactive visualization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 text-sm">
                <p>
                  This sandbox helps you understand what a network really is: a router connected to many devices, each with their own identities and addresses.
                </p>
                <div>
                  <h4 className="mb-2 font-medium">Layer Goggles</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><span className="font-medium text-foreground">Link/Local:</span> See MAC addresses used for local delivery</li>
                    <li><span className="font-medium text-foreground">Network:</span> See IP addresses and routing boundaries</li>
                    <li><span className="font-medium text-foreground">Transport:</span> See data flows and port usage</li>
                    <li><span className="font-medium text-foreground">Application:</span> See protocols and encryption status</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 font-medium">Keyboard Shortcuts</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">1-4</kbd> Switch layer views</li>
                    <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">Esc</kbd> Deselect device</li>
                    <li><kbd className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">R</kbd> Reset view</li>
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground">
                  All networks and devices shown are fictional but realistic. No real network data is collected or displayed.
                </p>
              </div>
            </DialogContent>
          </Dialog>
          
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <LayerGoggles activeLayer={activeLayer} onChange={setActiveLayer} />
            
            <div className="flex items-center gap-2">
              <div className="flex rounded-md bg-muted p-1">
                <Button
                  variant={viewMode === "map" && !showComparison ? "default" : "ghost"}
                  size="sm"
                  onClick={() => { setViewMode("map"); setShowComparison(false); }}
                  data-testid="button-view-map"
                >
                  <Map className="mr-1.5 h-4 w-4" />
                  Map
                </Button>
                <Button
                  variant={viewMode === "table" && !showComparison ? "default" : "ghost"}
                  size="sm"
                  onClick={() => { setViewMode("table"); setShowComparison(false); }}
                  data-testid="button-view-table"
                >
                  <TableIcon className="mr-1.5 h-4 w-4" />
                  Table
                </Button>
                <Button
                  variant={showComparison ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  data-testid="button-view-compare"
                  disabled={!scenarioSummaries || scenarioSummaries.length < 2}
                >
                  <GitCompare className="mr-1.5 h-4 w-4" />
                  Compare
                </Button>
              </div>
              
              <ScenarioExportImport
                scenario={activeScenario || null}
                onImport={handleImportScenario}
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                data-testid="button-reset"
              >
                <RotateCcw className="mr-1.5 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {activeScenario && (
            <DeviceFilter
              devices={activeScenario.devices}
              networks={activeScenario.networks}
              filters={filters}
              onFiltersChange={setFilters}
            />
          )}

          <Card className="flex-1 overflow-hidden">
            {showComparison && scenarioSummaries ? (
              <ScenarioComparison
                scenarios={scenarioSummaries.map(s => ({ id: s.id, title: s.title }))}
                activeLayer={activeLayer}
                onClose={() => setShowComparison(false)}
              />
            ) : error ? (
              <div className="flex h-full items-center justify-center text-destructive" data-testid="error-state">
                <div className="text-center">
                  <AlertCircle className="mx-auto mb-3 h-12 w-12 opacity-70" />
                  <p className="font-medium">Failed to load scenario</p>
                  <p className="mt-1 text-sm text-muted-foreground">Please try refreshing the page</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex h-full items-center justify-center" data-testid="loading-state">
                <div className="text-center text-muted-foreground">
                  <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin opacity-50" />
                  <p className="text-sm">Loading network visualization...</p>
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
                />
              ) : (
                <TableView
                  devices={filteredDevices}
                  networks={activeScenario?.networks || []}
                  activeLayer={activeLayer}
                  selectedDeviceId={selectedDeviceId}
                  onDeviceSelect={handleDeviceSelect}
                />
              )
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Map className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>Select a scenario to begin exploring</p>
                </div>
              </div>
            )}
          </Card>

          <div className="rounded-md border bg-card/50 px-4 py-2">
            <LayerLegend activeLayer={activeLayer} />
          </div>
        </div>

        <aside className="flex h-80 w-full flex-col gap-4 lg:h-auto lg:w-96">
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              <DeviceDetailsPanel
                device={selectedDevice}
                network={selectedNetwork}
                activeLayer={activeLayer}
                onClose={() => setSelectedDeviceId(null)}
              />

              {selectedDevice && selectedDevice.type !== "router" && (
                <Card className="p-4">
                  {showPacketJourney ? (
                    <PacketJourney
                      sourceDevice={selectedDevice}
                      routerDevice={routerDevice}
                      activeLayer={activeLayer}
                      publicIp={activeScenario?.environment.publicIp || "0.0.0.0"}
                      onClose={() => setShowPacketJourney(false)}
                    />
                  ) : (
                    <div className="text-center">
                      <Zap className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                      <p className="mb-3 text-sm text-muted-foreground">
                        Trace how data travels from this device through the network
                      </p>
                      <Button size="sm" onClick={handleTogglePacketJourney} data-testid="button-start-packet-journey">
                        <Zap className="mr-1.5 h-4 w-4" />
                        Trace Packet Journey
                      </Button>
                    </div>
                  )}
                </Card>
              )}
              
              {activeScenario && activeScenario.learningPrompts.length > 0 && (
                <LearningPrompts prompts={activeScenario.learningPrompts} />
              )}
            </div>
          </ScrollArea>
        </aside>
      </div>

      {activeScenario && activeScenario.description && (
        <footer className="border-t bg-muted/30 px-4 py-2">
          <p className="text-center text-xs text-muted-foreground">
            {activeScenario.description}
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
        device={selectedDevice && (selectedDevice.type === "unknown" || selectedDevice.riskFlags.includes("unknown_device")) ? selectedDevice : null}
        isOpen={showUnknownModal}
        onClose={() => setShowUnknownModal(false)}
      />
    </div>
  );
}
