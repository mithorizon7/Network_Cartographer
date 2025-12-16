import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Device, LayerMode } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Zap, ArrowRight, Globe, Server, Wifi } from "lucide-react";

interface PacketJourneyProps {
  sourceDevice: Device | null;
  routerDevice: Device | null;
  activeLayer: LayerMode;
  publicIp: string;
  onClose: () => void;
}

type JourneyStep = "idle" | "device-to-router" | "router-processing" | "router-to-internet" | "internet-response" | "router-back" | "complete";

const stepDescriptions: Record<JourneyStep, Record<LayerMode, string>> = {
  idle: {
    link: "Ready to trace packet journey using MAC addresses",
    network: "Ready to trace packet journey using IP addresses",
    transport: "Ready to trace packet journey through ports",
    application: "Ready to trace packet journey at application level",
  },
  "device-to-router": {
    link: "Packet leaves device with source MAC → Router MAC as destination",
    network: "Packet carries source IP (device) → destination IP (internet server)",
    transport: "Data sent from random high port → destination port (e.g., 443 for HTTPS)",
    application: "Application sends HTTP/HTTPS request through socket",
  },
  "router-processing": {
    link: "Router receives frame, strips MAC header, reads IP destination",
    network: "Router performs NAT: replaces private IP with public IP for internet",
    transport: "Router tracks connection state for return traffic mapping",
    application: "Router may inspect application headers (firewall/filtering)",
  },
  "router-to-internet": {
    link: "New frame created with Router WAN MAC → ISP Gateway MAC",
    network: "Packet now has public IP as source, routes through internet",
    transport: "Port mapping stored so response can find original device",
    application: "Request reaches destination server (website, API, etc.)",
  },
  "internet-response": {
    link: "Response arrives at router's WAN interface from ISP",
    network: "Response addressed to router's public IP, port identifies flow",
    transport: "Server responds on established connection (same port pair)",
    application: "Server sends response data (HTML, JSON, file, etc.)",
  },
  "router-back": {
    link: "Router rewrites destination MAC to original device's MAC",
    network: "NAT reversal: replaces public IP with device's private IP",
    transport: "Original source port used to deliver to correct application",
    application: "Response delivered to waiting application on device",
  },
  complete: {
    link: "Journey complete - device received response via MAC addressing",
    network: "Journey complete - private IP successfully communicated with internet",
    transport: "Journey complete - full request/response cycle through ports",
    application: "Journey complete - application received server response",
  },
};

export function PacketJourney({ sourceDevice, routerDevice, activeLayer, publicIp, onClose }: PacketJourneyProps) {
  const [currentStep, setCurrentStep] = useState<JourneyStep>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const steps: JourneyStep[] = [
    "device-to-router",
    "router-processing", 
    "router-to-internet",
    "internet-response",
    "router-back",
    "complete"
  ];

  useEffect(() => {
    const stepIndex = steps.indexOf(currentStep);
    if (stepIndex >= 0) {
      setProgress(((stepIndex + 1) / steps.length) * 100);
    } else {
      setProgress(0);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isPlaying) return;

    const stepDuration = 2500;
    const stepIndex = steps.indexOf(currentStep);
    
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
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex]);
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
      <div className="rounded-md border bg-muted/30 p-4 text-center text-sm text-muted-foreground" data-testid="packet-journey-empty">
        <Zap className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p>Select a device to trace its packet journey</p>
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

  return (
    <div className="space-y-4" data-testid="packet-journey">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={layerColors[activeLayer]}>
            <Zap className="mr-1 h-3 w-3" />
            Packet Journey
          </Badge>
          <span className="text-sm text-muted-foreground">
            {sourceDevice.label} → Internet
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-journey">
          Close
        </Button>
      </div>

      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`absolute inset-y-0 left-0 ${
            activeLayer === "link" ? "bg-chart-1" :
            activeLayer === "network" ? "bg-chart-3" :
            activeLayer === "transport" ? "bg-chart-4" :
            "bg-green-500"
          }`}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="flex items-center justify-center gap-2">
        {isPlaying ? (
          <Button size="sm" variant="outline" onClick={handlePause} data-testid="button-pause-journey">
            <Pause className="mr-1.5 h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button size="sm" onClick={handlePlay} data-testid="button-play-journey">
            <Play className="mr-1.5 h-4 w-4" />
            {currentStep === "complete" ? "Replay" : currentStep === "idle" ? "Start Journey" : "Resume"}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={handleReset} data-testid="button-reset-journey">
          <RotateCcw className="mr-1.5 h-4 w-4" />
          Reset
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
            <div className="mt-0.5 flex-shrink-0">
              {getStepIcon(currentStep)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium capitalize">
                  {currentStep === "idle" ? "Ready" : currentStep.replace(/-/g, " ")}
                </span>
                {isPlaying && currentStep !== "complete" && currentStep !== "idle" && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                )}
              </div>
              <p className="text-sm opacity-90">
                {stepDescriptions[currentStep][activeLayer]}
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
          transition={{ duration: 0.5, repeat: currentStep === "device-to-router" && isPlaying ? Infinity : 0 }}
        >
          <Wifi className="h-3 w-3" />
          <span className="font-mono text-[10px]">{sourceDevice.ip}</span>
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
            currentStep === "router-processing" 
              ? "border-primary bg-primary/10" 
              : "bg-muted"
          }`}
          animate={{ scale: currentStep === "router-processing" ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: currentStep === "router-processing" && isPlaying ? Infinity : 0 }}
        >
          <Server className="h-3 w-3" />
          <span className="font-mono text-[10px]">{routerDevice.ip}</span>
        </motion.div>
        
        <div className="relative flex items-center">
          <div className="h-px w-6 bg-muted-foreground/30" />
          <AnimatePresence>
            {(currentStep === "router-to-internet" || currentStep === "internet-response") && isPlaying && (
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
            (currentStep === "router-to-internet" || currentStep === "internet-response") 
              ? "border-chart-5 bg-chart-5/10" 
              : "bg-muted"
          }`}
          animate={{ scale: (currentStep === "router-to-internet" || currentStep === "internet-response") ? [1, 1.05, 1] : 1 }}
          transition={{ duration: 0.5, repeat: (currentStep === "router-to-internet" || currentStep === "internet-response") && isPlaying ? Infinity : 0 }}
        >
          <Globe className="h-3 w-3" />
          <span className="font-mono text-[10px]">{publicIp}</span>
        </motion.div>
      </div>
    </div>
  );
}
