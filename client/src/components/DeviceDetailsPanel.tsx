import { useTranslation } from "react-i18next";
import type { Device, Network, LayerMode } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Router, Laptop, Smartphone, Tablet, Camera, Tv, Speaker, Thermometer, Printer, Gamepad2, HelpCircle, AlertTriangle, Shield, Lock, Unlock } from "lucide-react";
import { deviceLabelToKey } from "@/lib/scenarioUtils";

interface DeviceDetailsPanelProps {
  device: Device | null;
  network: Network | null;
  activeLayer: LayerMode;
  onClose: () => void;
}

const deviceIcons: Record<string, typeof Router> = {
  router: Router,
  laptop: Laptop,
  phone: Smartphone,
  tablet: Tablet,
  camera: Camera,
  smarttv: Tv,
  speaker: Speaker,
  thermostat: Thermometer,
  printer: Printer,
  gaming: Gamepad2,
  unknown: HelpCircle,
};

const riskVariants: Record<string, "default" | "destructive" | "secondary"> = {
  iot_device: "secondary",
  default_password: "destructive",
  outdated_firmware: "destructive",
  unknown_device: "destructive",
  unencrypted_traffic: "destructive",
  forgotten_device: "secondary",
};

export function DeviceDetailsPanel({ device, network, activeLayer, onClose }: DeviceDetailsPanelProps) {
  const { t } = useTranslation();
  
  if (!device) {
    return (
      <Card className="flex h-full flex-col" data-testid="panel-device-empty">
        <CardHeader className="pb-4">
          <div className="text-center text-muted-foreground">
            <HelpCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="text-sm font-medium">{t('devicePanel.noDeviceSelected')}</p>
            <p className="mt-1 text-xs">{t('devicePanel.clickToSelect')}</p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  const Icon = deviceIcons[device.type] || HelpCircle;
  const hasRisks = device.riskFlags.length > 0;

  return (
    <Card className="flex h-full flex-col" data-testid="device-details-panel">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 border-b pb-4">
        <div className="flex items-start gap-3">
          <div className={`rounded-md p-2 ${hasRisks ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight" data-testid="text-device-name">
              {deviceLabelToKey[device.label] 
                ? t(`deviceLabels.${deviceLabelToKey[device.label]}`, { defaultValue: device.label })
                : device.label}
            </h2>
            <p className="text-sm text-muted-foreground capitalize">{t(`deviceTypes.${device.type}`, device.type)}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-panel" aria-label="Close panel">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden pt-4">
        <Tabs defaultValue="details" className="flex h-full flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1" data-testid="tab-details">{t('devicePanel.tabs.details')}</TabsTrigger>
            <TabsTrigger value="network" className="flex-1" data-testid="tab-network">{t('devicePanel.tabs.network')}</TabsTrigger>
            <TabsTrigger value="learn" className="flex-1" data-testid="tab-learn">{t('devicePanel.tabs.learn')}</TabsTrigger>
          </TabsList>
          <ScrollArea className="flex-1 pt-4">
            <TabsContent value="details" className="mt-0 space-y-4">
              {device.riskFlags.length > 0 && (
                <div className="rounded-md border border-destructive/30 bg-card p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    {t('devicePanel.securityConcerns')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {device.riskFlags.map((flag) => {
                      const variant = riskVariants[flag] || "secondary";
                      return (
                        <Badge key={flag} variant={variant} className="text-xs">
                          {t(`riskFlags.${flag}`, flag.replace(/_/g, " "))}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {device.description && (
                <div>
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.description')}</h3>
                  <p className="text-sm leading-relaxed">{device.description}</p>
                </div>
              )}
              
              {device.manufacturer && (
                <div>
                  <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.manufacturer')}</h3>
                  <p className="text-sm">{device.manufacturer}</p>
                </div>
              )}
              
              {device.protocols && device.protocols.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.activeProtocols')}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {device.protocols.map((protocol) => (
                      <Badge key={protocol} variant="secondary" className="text-xs">
                        {protocol.startsWith("HTTP") ? (
                          <Lock className="mr-1 h-3 w-3" />
                        ) : protocol === "HTTP" ? (
                          <Unlock className="mr-1 h-3 w-3" />
                        ) : null}
                        {protocol}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="network" className="mt-0 space-y-4">
              <div className="space-y-3">
                <div className="rounded-md bg-muted/50 p-3">
                  <h3 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {activeLayer === "link" ? <Shield className="h-3 w-3" /> : null}
                    {activeLayer === "link" ? t('devicePanel.localId') : t('devicePanel.ipAddress')}
                  </h3>
                  <p className="font-mono text-sm" data-testid="text-device-address">
                    {activeLayer === "link" ? device.localId : device.ip}
                  </p>
                </div>
                
                {activeLayer !== "link" && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.localId')}</h3>
                    <p className="font-mono text-sm">{device.localId}</p>
                  </div>
                )}
                
                {network && (
                  <>
                    <div className="rounded-md bg-muted/50 p-3">
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.network')}</h3>
                      <p className="text-sm font-medium">{network.ssid}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {network.security} • {network.subnet}
                      </p>
                    </div>
                    
                    <div className="rounded-md bg-muted/50 p-3">
                      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.zone')}</h3>
                      <Badge variant="secondary" className="capitalize">{t(`zones.${network.zone}`, network.zone)}</Badge>
                    </div>
                  </>
                )}
                
                {device.openPorts && device.openPorts.length > 0 && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('devicePanel.openPorts')}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {device.openPorts.map((port) => (
                        <Badge key={port} variant="secondary" className="font-mono text-xs">
                          {port}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="learn" className="mt-0 space-y-4">
              <div className="rounded-md border border-primary/20 bg-card p-4">
                <h3 className="mb-2 font-medium text-primary">{t('devicePanel.whatToNotice')}</h3>
                {device.type === "router" && (
                  <p className="text-sm leading-relaxed">
                    {t('devicePanel.learnContent.router')}
                  </p>
                )}
                {device.type === "unknown" && (
                  <p className="text-sm leading-relaxed">
                    {t('devicePanel.learnContent.unknown')}
                  </p>
                )}
                {device.riskFlags.includes("default_password") && (
                  <p className="text-sm leading-relaxed">
                    {t('devicePanel.learnContent.defaultPassword')}
                  </p>
                )}
                {device.riskFlags.includes("iot_device") && !device.riskFlags.includes("default_password") && (
                  <p className="text-sm leading-relaxed">
                    {t('devicePanel.learnContent.iotDevice')}
                  </p>
                )}
                {device.riskFlags.includes("forgotten_device") && (
                  <p className="text-sm leading-relaxed">
                    {t('devicePanel.learnContent.forgottenDevice')}
                  </p>
                )}
                {device.riskFlags.length === 0 && device.type !== "router" && device.type !== "unknown" && (
                  <p className="text-sm leading-relaxed">
                    {t('devicePanel.learnContent.safeDevice')}
                  </p>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}
