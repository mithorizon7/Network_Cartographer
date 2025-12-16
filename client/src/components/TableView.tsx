import type { Device, Network, LayerMode } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Router, Laptop, Smartphone, Tablet, Camera, Tv, Speaker, Thermometer, Printer, Gamepad2, HelpCircle, AlertTriangle } from "lucide-react";

interface TableViewProps {
  devices: Device[];
  networks: Network[];
  activeLayer: LayerMode;
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
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

export function TableView({ devices, networks, activeLayer, selectedDeviceId, onDeviceSelect }: TableViewProps) {
  const getNetworkForDevice = (networkId: string) => networks.find(n => n.id === networkId);

  return (
    <ScrollArea className="h-full" data-testid="table-view">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Device</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Network</TableHead>
            <TableHead>{activeLayer === "link" ? "MAC Address" : "IP Address"}</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {devices.map((device) => {
            const Icon = deviceIcons[device.type] || HelpCircle;
            const network = getNetworkForDevice(device.networkId);
            const hasRisks = device.riskFlags.length > 0;
            const isSelected = selectedDeviceId === device.id;

            return (
              <TableRow
                key={device.id}
                className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : ""}`}
                onClick={() => onDeviceSelect(device.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onDeviceSelect(device.id);
                  }
                }}
                data-testid={`row-device-${device.id}`}
                role="button"
                aria-pressed={isSelected}
              >
                <TableCell>
                  <div className={`rounded-md p-1.5 ${hasRisks ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </TableCell>
                <TableCell className="font-medium" data-testid={`text-device-label-${device.id}`}>
                  {device.label}
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {device.type === "unknown" ? "Unidentified" : device.type}
                </TableCell>
                <TableCell>
                  {network ? (
                    <div>
                      <span className="text-sm">{network.ssid}</span>
                      <Badge variant="secondary" className="ml-2 text-xs capitalize">
                        {network.zone}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {activeLayer === "link" ? device.localId : device.ip}
                </TableCell>
                <TableCell>
                  {hasRisks ? (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">{device.riskFlags.length} issue{device.riskFlags.length > 1 ? "s" : ""}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">OK</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
