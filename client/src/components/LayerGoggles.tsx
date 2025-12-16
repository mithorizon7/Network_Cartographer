import type { LayerMode } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Link2, Network, ArrowLeftRight, Globe } from "lucide-react";

interface LayerGogglesProps {
  activeLayer: LayerMode;
  onChange: (layer: LayerMode) => void;
}

const layers: { mode: LayerMode; label: string; shortLabel: string; icon: typeof Link2; description: string }[] = [
  { mode: "link", label: "Link/Local", shortLabel: "Link", icon: Link2, description: "MAC addresses & local delivery" },
  { mode: "network", label: "Network", shortLabel: "Net", icon: Network, description: "IP addresses & routing" },
  { mode: "transport", label: "Transport", shortLabel: "Trans", icon: ArrowLeftRight, description: "Ports & data flows" },
  { mode: "application", label: "Application", shortLabel: "App", icon: Globe, description: "Protocols & encryption" },
];

export function LayerGoggles({ activeLayer, onChange }: LayerGogglesProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1 rounded-md bg-muted p-1" role="group" aria-label="Layer view selector">
        {layers.map(({ mode, label, shortLabel, icon: Icon }) => (
          <Button
            key={mode}
            variant={activeLayer === mode ? "default" : "ghost"}
            size="sm"
            onClick={() => onChange(mode)}
            data-testid={`button-layer-${mode}`}
            className="flex-1 gap-1.5 text-xs sm:text-sm"
            aria-pressed={activeLayer === mode}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{shortLabel}</span>
          </Button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {layers.find(l => l.mode === activeLayer)?.description}
      </p>
    </div>
  );
}

export function LayerLegend({ activeLayer }: { activeLayer: LayerMode }) {
  const legendItems = {
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
      { color: "bg-green-500", label: "HTTPS (Encrypted)" },
      { color: "bg-red-500", label: "HTTP (Not encrypted)" },
      { color: "bg-chart-2", label: "Streaming" },
    ],
  };

  const items = legendItems[activeLayer];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground" data-testid="layer-legend">
      {items.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full ${color}`} />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
