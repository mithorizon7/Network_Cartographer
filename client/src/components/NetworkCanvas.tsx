import { useMemo, useCallback, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Device, Network, LayerMode, Scenario } from "@shared/schema";
import { Router, Laptop, Smartphone, Tablet, Camera, Tv, Speaker, Thermometer, Printer, Gamepad2, HelpCircle, Globe, ArrowRight, Lock, Unlock } from "lucide-react";
import { scenarioIdToKey } from "@/lib/scenarioUtils";

interface NetworkCanvasProps {
  scenario: Scenario;
  activeLayer: LayerMode;
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  highlightedDeviceIds?: Set<string>;
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

const zoneColors: Record<string, { ring: string; fill: string; labelKey: string }> = {
  main: { ring: "stroke-chart-1", fill: "fill-chart-1/10", labelKey: "zones.main" },
  guest: { ring: "stroke-chart-3", fill: "fill-chart-3/10", labelKey: "zones.guest" },
  iot: { ring: "stroke-chart-5", fill: "fill-chart-5/10", labelKey: "zones.iot" },
};

const zoneRadii: Record<string, number> = {
  main: 140,
  guest: 220,
  iot: 300,
};

const layerLabelColors: Record<LayerMode, string> = {
  link: "fill-chart-1",
  network: "fill-chart-3",
  transport: "fill-chart-4",
  application: "fill-green-500 dark:fill-green-400",
};

const portToService: Record<number, string> = {
  22: "SSH",
  80: "HTTP",
  443: "HTTPS",
  445: "SMB",
  554: "RTSP",
  9100: "Print",
};

const encryptedProtocols = new Set([
  "HTTPS", "SSH", "TLS", "SFTP", "WSS", "IMAPS", "SMTPS", "POP3S", 
  "FTPS", "LDAPS", "DNSCrypt", "WireGuard", "OpenVPN", "IPSec",
  "iMessage", "Signal", "WhatsApp"
]);
const unencryptedProtocols = new Set([
  "HTTP", "FTP", "Telnet", "RTSP", "SMTP", "POP3", "IMAP", 
  "DNS", "NTP", "SNMP", "TFTP", "Gopher"
]);

function getEncryptionStatus(device: Device): "encrypted" | "mixed" | "unencrypted" | "unknown" {
  if (!device.protocols || device.protocols.length === 0) return "unknown";
  const hasEncrypted = device.protocols.some(p => encryptedProtocols.has(p));
  const hasUnencrypted = device.protocols.some(p => unencryptedProtocols.has(p));
  if (hasEncrypted && hasUnencrypted) return "mixed";
  if (hasEncrypted) return "encrypted";
  if (hasUnencrypted) return "unencrypted";
  return "unknown";
}

function getDeviceLabel(device: Device, activeLayer: LayerMode): string {
  switch (activeLayer) {
    case "link":
      return device.localId.slice(-8);
    case "network":
      return device.ip;
    case "transport": {
      if (!device.openPorts || device.openPorts.length === 0) return "—";
      const services = device.openPorts.slice(0, 2).map(p => portToService[p] || `:${p}`);
      return services.join(", ");
    }
    case "application": {
      if (!device.protocols || device.protocols.length === 0) return "—";
      return device.protocols.slice(0, 2).join(", ");
    }
    default:
      return device.label;
  }
}

function DeviceNode({ 
  device, 
  pos, 
  activeLayer, 
  isSelected,
  isHighlighted = true,
  onClick, 
  onKeyDown 
}: { 
  device: Device; 
  pos: { x: number; y: number; zone: string };
  activeLayer: LayerMode;
  isSelected: boolean;
  isHighlighted?: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const { t } = useTranslation();
  const Icon = deviceIcons[device.type] || HelpCircle;
  const hasRisks = device.riskFlags.length > 0;
  const isUnknown = device.type === "unknown" || device.riskFlags.includes("unknown_device");
  const isRouter = device.type === "router";
  const rawLabel = getDeviceLabel(device, activeLayer);
  const label = rawLabel === "—" ? t('common.noData') : rawLabel;
  const labelColor = layerLabelColors[activeLayer];
  const securityLabel = hasRisks ? `, ${t('common.hasSecurityConcerns')}` : "";
  const encryptionStatus = getEncryptionStatus(device);

  const nodeSize = isRouter ? 56 : 44;
  const iconSize = isRouter ? 28 : 20;
  const dimmedOpacity = isHighlighted ? 1 : 0.25;

  return (
    <g
      className="cursor-pointer"
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${device.label}${securityLabel}`}
      aria-pressed={isSelected}
      data-testid={`node-device-${device.id}`}
      style={{ opacity: dimmedOpacity }}
    >
      <motion.circle
        cx={pos.x}
        cy={pos.y}
        r={nodeSize / 2 + 8}
        style={{ strokeWidth: 0 }}
        initial={false}
        animate={{
          fill: isSelected ? "rgba(var(--primary-rgb), 0.2)" : "transparent",
          stroke: isSelected ? "hsl(var(--primary))" : "transparent",
          strokeWidth: isSelected ? 3 : 0,
        }}
        transition={{ duration: 0.2 }}
      />

      <motion.circle
        cx={pos.x}
        cy={pos.y}
        r={nodeSize / 2}
        className={`${
          isUnknown
            ? "animate-pulse fill-destructive/20 stroke-destructive stroke-[2]"
            : hasRisks
              ? "fill-destructive/10 stroke-destructive/50 stroke-[1.5]"
              : isRouter
                ? "fill-primary/15 stroke-primary stroke-[2]"
                : "fill-card stroke-border stroke-[1.5]"
        }`}
        initial={false}
        animate={{ scale: isSelected ? 1.05 : 1 }}
        transition={{ duration: 0.2, type: "spring", stiffness: 300 }}
        filter={isSelected ? "url(#glow)" : undefined}
      />

      <foreignObject
        x={pos.x - iconSize / 2}
        y={pos.y - iconSize / 2}
        width={iconSize}
        height={iconSize}
      >
        <motion.div 
          className="flex h-full w-full items-center justify-center"
          initial={false}
          animate={{ scale: isSelected ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <Icon
            className={`${
              isUnknown || hasRisks
                ? "text-destructive"
                : isRouter
                  ? "text-primary"
                  : "text-foreground"
            }`}
            style={{ width: iconSize * 0.7, height: iconSize * 0.7 }}
          />
        </motion.div>
      </foreignObject>

      <text
        x={pos.x}
        y={pos.y + nodeSize / 2 + 14}
        textAnchor="middle"
        className="fill-foreground text-[11px] font-medium"
      >
        {device.label.length > 16 ? device.label.slice(0, 14) + "..." : device.label}
      </text>
      
      {activeLayer !== "link" || device.type !== "router" ? (
        <AnimatePresence mode="wait">
          <motion.text
            key={`${device.id}-${activeLayer}`}
            x={pos.x}
            y={pos.y + nodeSize / 2 + 26}
            textAnchor="middle"
            className={`${labelColor} font-mono text-[9px]`}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.2 }}
          >
            {label}
          </motion.text>
        </AnimatePresence>
      ) : null}

      {activeLayer === "application" && encryptionStatus !== "unknown" && !isRouter && (
        <AnimatePresence>
          <motion.g
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <foreignObject
              x={pos.x + nodeSize / 2 + 6}
              y={pos.y - nodeSize / 2 - 12}
              width={18}
              height={18}
            >
              <div 
                className={`flex items-center justify-center rounded-full w-4 h-4 ${
                  encryptionStatus === "encrypted" 
                    ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                    : encryptionStatus === "unencrypted"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                }`}
                title={
                  encryptionStatus === "encrypted" 
                    ? t('encryption.encrypted')
                    : encryptionStatus === "unencrypted"
                      ? t('encryption.unencrypted')
                      : t('encryption.mixed')
                }
              >
                {encryptionStatus === "encrypted" ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : (
                  <Unlock className="w-2.5 h-2.5" />
                )}
              </div>
            </foreignObject>
          </motion.g>
        </AnimatePresence>
      )}
    </g>
  );
}

export function NetworkCanvas({ scenario, activeLayer, selectedDeviceId, onDeviceSelect, highlightedDeviceIds }: NetworkCanvasProps) {
  const { t } = useTranslation();
  const centerX = 400;
  const centerY = 350;
  const hasFilter = highlightedDeviceIds !== undefined;
  const [layerPulse, setLayerPulse] = useState(false);

  useEffect(() => {
    setLayerPulse(true);
    const timeout = setTimeout(() => setLayerPulse(false), 600);
    return () => clearTimeout(timeout);
  }, [activeLayer]);

  const devicePositions = useMemo(() => {
    const positions: Map<string, { x: number; y: number; zone: string }> = new Map();
    
    const router = scenario.devices.find(d => d.type === "router");
    if (router) {
      positions.set(router.id, { x: centerX, y: centerY, zone: "main" });
    }

    const devicesByZone: Record<string, Device[]> = { main: [], guest: [], iot: [] };
    
    scenario.devices
      .filter(d => d.type !== "router")
      .forEach(device => {
        const network = scenario.networks.find(n => n.id === device.networkId);
        const zone = network?.zone || "main";
        devicesByZone[zone].push(device);
      });

    Object.entries(devicesByZone).forEach(([zone, devices]) => {
      const radius = zoneRadii[zone] || 140;
      const angleStep = (2 * Math.PI) / Math.max(devices.length, 1);
      const startAngle = -Math.PI / 2;

      devices.forEach((device, index) => {
        const angle = startAngle + index * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        positions.set(device.id, { x, y, zone });
      });
    });

    return positions;
  }, [scenario]);

  const handleDeviceClick = useCallback((deviceId: string) => {
    onDeviceSelect(deviceId);
  }, [onDeviceSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, deviceId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onDeviceSelect(deviceId);
    }
  }, [onDeviceSelect]);

  const router = scenario.devices.find(d => d.type === "router");
  const routerPos = router ? devicePositions.get(router.id) : null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-md bg-gradient-to-br from-background to-muted/30" data-testid="network-canvas">
      <svg
        viewBox="0 0 800 700"
        className="h-full w-full"
        role="img"
        aria-label="Network visualization showing devices connected to router"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" className="fill-muted-foreground/30" />
          </marker>
          <radialGradient id="pulseGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
            <stop offset="70%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="routerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </radialGradient>
        </defs>

        <AnimatePresence>
          {layerPulse && (
            <motion.circle
              cx={centerX}
              cy={centerY}
              r={50}
              fill="url(#pulseGradient)"
              initial={{ r: 30, opacity: 0.8 }}
              animate={{ r: 350, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          )}
        </AnimatePresence>

        <motion.circle
          cx={centerX}
          cy={centerY}
          r={80}
          fill="url(#routerGlow)"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.7, 0.5]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {Object.entries(zoneRadii).map(([zone, radius]) => {
          const zoneColor = zoneColors[zone];
          const hasDevices = scenario.devices.some(d => {
            const network = scenario.networks.find(n => n.id === d.networkId);
            return network?.zone === zone && d.type !== "router";
          });
          
          if (!hasDevices && zone !== "main") return null;
          
          return (
            <g key={zone}>
              <motion.circle
                cx={centerX}
                cy={centerY}
                r={radius}
                className={`${zoneColor.ring} ${zoneColor.fill} stroke-[1.5] stroke-dashed`}
                strokeDasharray="8 4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              />
              <text
                x={centerX + radius - 10}
                y={centerY - radius + 20}
                className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider"
              >
                {t(zoneColor.labelKey)}
              </text>
            </g>
          );
        })}

        {routerPos && scenario.devices.filter(d => d.type !== "router").map((device, deviceIndex) => {
          const pos = devicePositions.get(device.id);
          if (!pos) return null;

          const isSelected = selectedDeviceId === device.id;
          const hasRisks = device.riskFlags.length > 0;
          const showDataFlow = activeLayer === "transport" || activeLayer === "application";

          return (
            <g key={`connection-${device.id}`}>
              <motion.line
                x1={routerPos.x}
                y1={routerPos.y}
                x2={pos.x}
                y2={pos.y}
                initial={{ pathLength: 0, opacity: 0, strokeWidth: 1 }}
                animate={{ 
                  pathLength: 1, 
                  opacity: 1,
                  strokeWidth: isSelected ? 2.5 : 1,
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`${
                  isSelected 
                    ? "stroke-primary" 
                    : hasRisks 
                      ? "stroke-destructive/30" 
                      : "stroke-muted-foreground/20"
                }`}
              />
              
              {showDataFlow && !hasRisks && (
                <motion.circle
                  r={3}
                  className={isSelected ? "fill-primary" : "fill-chart-1/60"}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    cx: [routerPos.x, pos.x],
                    cy: [routerPos.y, pos.y],
                  }}
                  transition={{
                    duration: 2 + deviceIndex * 0.3,
                    repeat: Infinity,
                    delay: deviceIndex * 0.4,
                    ease: "linear",
                  }}
                />
              )}
              
              {showDataFlow && !hasRisks && (
                <motion.circle
                  r={3}
                  className={isSelected ? "fill-primary" : "fill-chart-3/60"}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    cx: [pos.x, routerPos.x],
                    cy: [pos.y, routerPos.y],
                  }}
                  transition={{
                    duration: 2.5 + deviceIndex * 0.2,
                    repeat: Infinity,
                    delay: deviceIndex * 0.6 + 1,
                    ease: "linear",
                  }}
                />
              )}
            </g>
          );
        })}

        <AnimatePresence>
          {activeLayer === "network" && routerPos && (
            <motion.g
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <line
                x1={routerPos.x}
                y1={routerPos.y}
                x2={routerPos.x}
                y2={50}
                className="stroke-chart-5 stroke-[2]"
                strokeDasharray="6 3"
                markerEnd="url(#arrowhead)"
              />
              <foreignObject x={routerPos.x + 10} y={80} width={120} height={40}>
                <motion.div 
                  className="flex items-center gap-1.5 rounded bg-chart-5/10 px-2 py-1 text-xs font-medium text-chart-5"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <Globe className="h-3 w-3" />
                  <span className="font-mono">{scenario.environment.publicIp}</span>
                </motion.div>
              </foreignObject>
              <text
                x={routerPos.x + 10}
                y={65}
                className="fill-muted-foreground text-[10px] uppercase tracking-wider"
              >
                Internet
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {scenario.devices.map(device => {
          const pos = devicePositions.get(device.id);
          if (!pos) return null;

          const isHighlighted = !hasFilter || highlightedDeviceIds.has(device.id) || device.type === "router";

          return (
            <DeviceNode
              key={device.id}
              device={device}
              pos={pos}
              activeLayer={activeLayer}
              isSelected={selectedDeviceId === device.id}
              isHighlighted={isHighlighted}
              onClick={() => handleDeviceClick(device.id)}
              onKeyDown={(e) => handleKeyDown(e, device.id)}
            />
          );
        })}

        <AnimatePresence>
          {activeLayer === "transport" && routerPos && (
            <motion.g 
              className="pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {[
                { label: "HTTPS", offset: -30, color: "text-green-500 dark:text-green-400" },
                { label: "Video", offset: 0, color: "text-chart-2" },
                { label: "Email", offset: 30, color: "text-chart-4" },
              ].map((flow, i) => (
                <motion.g 
                  key={flow.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <line
                    x1={routerPos.x + flow.offset}
                    y1={routerPos.y - 35}
                    x2={routerPos.x + flow.offset}
                    y2={100}
                    className={`stroke-current ${flow.color} stroke-[1.5] opacity-40`}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={routerPos.x + flow.offset}
                    y={90}
                    textAnchor="middle"
                    className={`text-[8px] ${flow.color}`}
                  >
                    {flow.label}
                  </text>
                </motion.g>
              ))}
            </motion.g>
          )}
        </AnimatePresence>
      </svg>

      <motion.div 
        className="absolute bottom-4 left-4 rounded-md bg-card/80 px-3 py-2 text-xs backdrop-blur-sm" 
        data-testid="scenario-info"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="font-medium">
          {scenarioIdToKey[scenario.id] 
            ? t(`scenarioContent.${scenarioIdToKey[scenario.id]}.title`, { defaultValue: scenario.title })
            : scenario.title}
        </div>
        <div className="mt-1 text-muted-foreground">
          {scenario.devices.length} devices • {scenario.networks.length} networks
        </div>
      </motion.div>
    </div>
  );
}
