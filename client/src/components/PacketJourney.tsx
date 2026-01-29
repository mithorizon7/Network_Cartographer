import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Device, LayerMode, Flow } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Globe,
  Server,
  Wifi,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { deviceLabelToKey } from "@/lib/scenarioUtils";
import { formatMac } from "@/lib/macUtils";

interface PacketJourneyProps {
  sourceDevice: Device | null;
  routerDevice: Device | null;
  activeLayer: LayerMode;
  publicIp: string;
  flows?: Flow[];
  showFullMac?: boolean;
  onClose: () => void;
}

type JourneyStep =
  | "idle"
  | "device-to-router"
  | "router-processing"
  | "router-to-internet"
  | "internet-response"
  | "router-back"
  | "complete";

const stepToKey: Record<JourneyStep, string> = {
  idle: "idle",
  "device-to-router": "deviceToRouter",
  "router-processing": "routerProcessing",
  "router-to-internet": "routerToInternet",
  "internet-response": "internetResponse",
  "router-back": "routerBack",
  complete: "complete",
};

const journeySteps: JourneyStep[] = [
  "device-to-router",
  "router-processing",
  "router-to-internet",
  "internet-response",
  "router-back",
  "complete",
];

export function PacketJourney({
  sourceDevice,
  routerDevice,
  activeLayer,
  publicIp,
  flows = [],
  showFullMac = true,
  onClose,
}: PacketJourneyProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<JourneyStep>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [flowIndex, setFlowIndex] = useState(0);
  const sourceDeviceId = sourceDevice?.id;

  const deviceFlows = useMemo(
    () => (sourceDeviceId ? flows.filter((flow) => flow.srcDeviceId === sourceDeviceId) : []),
    [flows, sourceDeviceId],
  );

  useEffect(() => {
    const stepIndex = journeySteps.indexOf(currentStep);
    if (stepIndex >= 0) {
      setProgress(((stepIndex + 1) / journeySteps.length) * 100);
    } else {
      setProgress(0);
    }
  }, [currentStep]);

  useEffect(() => {
    setCurrentStep("idle");
    setIsPlaying(false);
    setProgress(0);
    setFlowIndex(0);
  }, [sourceDevice?.id, routerDevice?.id]);

  useEffect(() => {
    if (flowIndex >= deviceFlows.length) {
      setFlowIndex(0);
    }
  }, [deviceFlows.length, flowIndex]);

  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 2500;
    const stepIndex = journeySteps.indexOf(currentStep);

    if (currentStep === "idle") {
      setCurrentStep("device-to-router");
      return;
    }

    if (currentStep === "complete") {
      setIsPlaying(false);
      return;
    }

    const timer = setTimeout(() => {
      const nextIndex = stepIndex + 1;
      if (nextIndex < journeySteps.length) {
        setCurrentStep(journeySteps[nextIndex]);
      }
    }, stepDuration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const handlePlay = useCallback(() => {
    if (currentStep === "complete") {
      setCurrentStep("idle");
      setProgress(0);
    }
    setIsPlaying(true);
  }, [currentStep]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep("idle");
    setProgress(0);
  }, []);

  if (!sourceDevice || !routerDevice) {
    return (
      <div
        className="rounded-md border bg-muted p-4 text-center text-sm text-muted-foreground"
        data-testid="packet-journey-empty"
      >
        <Zap className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>{t("packetJourney.selectDevice")}</p>
      </div>
    );
  }

  const layerColors: Record<LayerMode, string> = {
    link: "bg-chart-1/10 text-chart-1 border-chart-1/30",
    network: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    transport: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    application: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30",
  };

  const getStepIcon = (step: JourneyStep) => {
    switch (step) {
      case "device-to-router":
      case "router-back":
        return <Wifi className="h-4 w-4" />;
      case "router-processing":
        return <Server className="h-4 w-4" />;
      case "router-to-internet":
      case "internet-response":
        return <Globe className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const sourceAddress =
    activeLayer === "link" ? formatMac(sourceDevice.localId, showFullMac) : sourceDevice.ip;
  const routerAddress =
    activeLayer === "link" ? formatMac(routerDevice.localId, showFullMac) : routerDevice.ip;
  const upstreamAddress = activeLayer === "link" ? t("packetJourney.ispGateway") : publicIp;
  const translatedSourceLabel = deviceLabelToKey[sourceDevice.label]
    ? t(`deviceLabels.${deviceLabelToKey[sourceDevice.label]}`, {
        defaultValue: sourceDevice.label,
      })
    : sourceDevice.label;
  const safeFlowIndex = flowIndex < deviceFlows.length ? flowIndex : 0;
  const activeFlow = deviceFlows[safeFlowIndex];
  const encryptionLabel = activeFlow
    ? activeFlow.encrypted
      ? t("encryption.encrypted")
      : t("encryption.unencrypted")
    : null;

  return (
    <div className="space-y-4" data-testid="packet-journey">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={layerColors[activeLayer]}>
            <Zap className="mr-1 h-3 w-3" />
            {t("packetJourney.title")}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {translatedSourceLabel} → {t("common.internet")}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-journey">
          {t("packetJourney.close")}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {activeFlow && encryptionLabel
          ? t("packetJourney.activeFlow", {
              destination: activeFlow.dstLabel,
              protocol: activeFlow.protocol,
              transport: activeFlow.transport,
              port: activeFlow.port,
              encryption: encryptionLabel,
            })
          : t("packetJourney.noFlow")}
      </div>

      {deviceFlows.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() =>
              setFlowIndex((prev) => (prev - 1 + deviceFlows.length) % deviceFlows.length)
            }
            data-testid="button-flow-prev"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="sr-only">{t("packetJourney.prevFlow")}</span>
          </Button>
          <span>
            {t("packetJourney.flowIndex", {
              current: safeFlowIndex + 1,
              total: deviceFlows.length,
            })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={() => setFlowIndex((prev) => (prev + 1) % deviceFlows.length)}
            data-testid="button-flow-next"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="sr-only">{t("packetJourney.nextFlow")}</span>
          </Button>
        </div>
      )}

      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`absolute inset-y-0 left-0 ${
            activeLayer === "link"
              ? "bg-chart-1"
              : activeLayer === "network"
                ? "bg-chart-3"
                : activeLayer === "transport"
                  ? "bg-chart-4"
                  : "bg-green-500"
          }`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        {isPlaying ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handlePause}
            data-testid="button-pause-journey"
          >
            <Pause className="mr-1.5 h-4 w-4" />
            {t("packetJourney.pause")}
          </Button>
        ) : (
          <Button size="sm" onClick={handlePlay} data-testid="button-play-journey">
            <Play className="mr-1.5 h-4 w-4" />
            {currentStep === "complete"
              ? t("packetJourney.replay")
              : currentStep === "idle"
                ? t("packetJourney.startJourney")
                : t("packetJourney.resume")}
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={handleReset}
          data-testid="button-reset-journey"
        >
          <RotateCcw className="mr-1.5 h-4 w-4" />
          {t("packetJourney.reset")}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className={`rounded-md border p-4 ${layerColors[activeLayer]}`}
          data-testid="journey-step-display"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">{getStepIcon(currentStep)}</div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium capitalize">
                  {currentStep === "idle"
                    ? t("packetJourney.ready")
                    : currentStep.replace(/-/g, " ")}
                </span>
                {isPlaying && currentStep !== "complete" && currentStep !== "idle" && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                )}
              </div>
              <p className="text-sm opacity-90">
                {t(`packetJourney.steps.${stepToKey[currentStep]}.${activeLayer}`)}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="relative flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
        <motion.div
          className={`flex items-center gap-1 rounded-md border px-2 py-1.5 transition-colors ${
            currentStep === "device-to-router" || currentStep === "complete"
              ? "border-primary bg-primary/10"
              : "bg-muted"
          }`}
          animate={{ scale: currentStep === "device-to-router" ? [1, 1.05, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: currentStep === "device-to-router" && isPlaying ? Infinity : 0,
          }}
        >
          <Wifi className="h-3 w-3" />
          <span className="font-mono text-[10px]">{sourceAddress}</span>
        </motion.div>

        <div className="relative flex items-center">
          <div className="h-px w-6 bg-muted-foreground/30" />
          <AnimatePresence>
            {(currentStep === "device-to-router" || currentStep === "router-back") && isPlaying && (
              <motion.div
                className="absolute left-0 h-2 w-2 rounded-full bg-primary"
                animate={{
                  x: currentStep === "device-to-router" ? [0, 24] : [24, 0],
                }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
            )}
          </AnimatePresence>
        </div>

        <motion.div
          className={`flex items-center gap-1 rounded-md border px-2 py-1.5 transition-colors ${
            currentStep === "router-processing" ? "border-primary bg-primary/10" : "bg-muted"
          }`}
          animate={{ scale: currentStep === "router-processing" ? [1, 1.05, 1] : 1 }}
          transition={{
            duration: 0.5,
            repeat: currentStep === "router-processing" && isPlaying ? Infinity : 0,
          }}
        >
          <Server className="h-3 w-3" />
          <span className="font-mono text-[10px]">{routerAddress}</span>
        </motion.div>

        <div className="relative flex items-center">
          <div className="h-px w-6 bg-muted-foreground/30" />
          <AnimatePresence>
            {(currentStep === "router-to-internet" || currentStep === "internet-response") &&
              isPlaying && (
                <motion.div
                  className="absolute left-0 h-2 w-2 rounded-full bg-chart-5"
                  animate={{
                    x: currentStep === "router-to-internet" ? [0, 24] : [24, 0],
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                />
              )}
          </AnimatePresence>
        </div>

        <motion.div
          className={`flex items-center gap-1 rounded-md border px-2 py-1.5 transition-colors ${
            currentStep === "router-to-internet" || currentStep === "internet-response"
              ? "border-chart-5 bg-chart-5/10"
              : "bg-muted"
          }`}
          animate={{
            scale:
              currentStep === "router-to-internet" || currentStep === "internet-response"
                ? [1, 1.05, 1]
                : 1,
          }}
          transition={{
            duration: 0.5,
            repeat:
              (currentStep === "router-to-internet" || currentStep === "internet-response") &&
              isPlaying
                ? Infinity
                : 0,
          }}
        >
          <Globe className="h-3 w-3" />
          <span className="font-mono text-[10px]">{upstreamAddress}</span>
        </motion.div>
      </div>
    </div>
  );
}
