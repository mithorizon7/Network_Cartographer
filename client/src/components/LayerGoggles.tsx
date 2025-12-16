import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { LayerMode } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link2, Network, ArrowLeftRight, Globe, ChevronRight } from "lucide-react";

interface LayerGogglesProps {
  activeLayer: LayerMode;
  onChange: (layer: LayerMode) => void;
}

const layerConfigs: { mode: LayerMode; labelKey: string; shortLabelKey: string; icon: typeof Link2; descriptionKey: string }[] = [
  { mode: "link", labelKey: "layers.link", shortLabelKey: "layers.link", icon: Link2, descriptionKey: "layers.linkDescription" },
  { mode: "network", labelKey: "layers.network", shortLabelKey: "layers.network", icon: Network, descriptionKey: "layers.networkDescription" },
  { mode: "transport", labelKey: "layers.transport", shortLabelKey: "layers.transport", icon: ArrowLeftRight, descriptionKey: "layers.transportDescription" },
  { mode: "application", labelKey: "layers.application", shortLabelKey: "layers.application", icon: Globe, descriptionKey: "layers.applicationDescription" },
];

const layerTransitions: Record<string, string> = {
  "link->network": "Now seeing IP addresses instead of hardware IDs",
  "network->link": "Now seeing hardware (MAC) addresses for local delivery",
  "link->transport": "Now seeing port numbers and service connections",
  "link->application": "Now seeing protocols and encryption status",
  "network->transport": "Now seeing which ports carry different traffic",
  "network->application": "Now seeing what applications are communicating",
  "transport->link": "Now seeing physical device identifiers",
  "transport->network": "Now seeing IP addresses for routing",
  "transport->application": "Now seeing the actual protocols in use",
  "application->link": "Now seeing hardware addresses",
  "application->network": "Now seeing logical IP addresses",
  "application->transport": "Now seeing port-level connections",
};

export function LayerGoggles({ activeLayer, onChange }: LayerGogglesProps) {
  const { t } = useTranslation();
  const [previousLayer, setPreviousLayer] = useState<LayerMode | null>(null);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLayerChange = (newLayer: LayerMode) => {
    if (newLayer === activeLayer) return;
    
    const transitionKey = `${activeLayer}->${newLayer}`;
    const message = layerTransitions[transitionKey];
    
    setPreviousLayer(activeLayer);
    setTransitionMessage(message || null);
    onChange(newLayer);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setTransitionMessage(null);
      setPreviousLayer(null);
    }, 2500);
  };

  const activeLayerInfo = layerConfigs.find(l => l.mode === activeLayer);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 rounded-md bg-muted p-1" role="group" aria-label={t('layers.title')}>
        {layerConfigs.map(({ mode, labelKey, shortLabelKey, icon: Icon }) => {
          const isActive = activeLayer === mode;
          const wasPrevious = previousLayer === mode;
          
          return (
            <motion.div
              key={mode}
              className="relative flex-1"
              initial={false}
            >
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleLayerChange(mode)}
                data-testid={`button-layer-${mode}`}
                className="w-full gap-1.5 text-xs sm:text-sm"
                aria-pressed={isActive}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    rotate: isActive && wasPrevious === false ? [0, -10, 10, 0] : 0,
                  }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </motion.div>
                <span className="hidden sm:inline">{t(labelKey)}</span>
                <span className="sm:hidden">{t(shortLabelKey)}</span>
              </Button>
              
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 h-0.5 bg-primary"
                    initial={{ width: 0, x: "-50%" }}
                    animate={{ width: "60%", x: "-50%" }}
                    exit={{ width: 0, x: "-50%" }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <div className="min-h-[3rem] overflow-hidden">
        <AnimatePresence mode="wait">
          {transitionMessage ? (
            <motion.div
              key="transition"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-center"
              data-testid="layer-transition-message"
            >
              <ChevronRight className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">{transitionMessage}</span>
            </motion.div>
          ) : (
            <motion.div
              key="description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-center"
            >
              <motion.p 
                className="text-xs text-muted-foreground"
                key={activeLayer}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeLayerInfo ? t(activeLayerInfo.descriptionKey) : null}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LayerLegend({ activeLayer }: { activeLayer: LayerMode }) {
  const legendItems: Record<LayerMode, { color: string; label: string }[]> = {
    link: [
      { color: "bg-chart-1", label: "Local ID (MAC)" },
      { color: "bg-chart-2", label: "Physical connection" },
    ],
    network: [
      { color: "bg-chart-1", label: "Private IP" },
      { color: "bg-chart-3", label: "Gateway" },
      { color: "bg-chart-5", label: "Public IP" },
    ],
    transport: [
      { color: "bg-chart-1", label: "Web traffic (443)" },
      { color: "bg-chart-2", label: "Video stream" },
      { color: "bg-chart-4", label: "Email (587)" },
    ],
    application: [
      { color: "bg-green-500 dark:bg-green-400", label: "HTTPS (Encrypted)" },
      { color: "bg-red-500 dark:bg-red-400", label: "HTTP (Not encrypted)" },
      { color: "bg-chart-2", label: "Streaming" },
    ],
  };

  const items = legendItems[activeLayer];

  return (
    <motion.div 
      className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground" 
      data-testid="layer-legend"
      key={activeLayer}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {items.map(({ color, label }, index) => (
        <motion.div 
          key={label} 
          className="flex items-center gap-1.5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
        >
          <motion.span 
            className={`h-3 w-3 rounded-full ${color}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: index * 0.05 + 0.1, type: "spring" }}
          />
          <span>{label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
