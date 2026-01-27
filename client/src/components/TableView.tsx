import { useTranslation } from "react-i18next";
import type { Device, Network, LayerMode } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Router, Server, Laptop, Smartphone, Tablet, Camera, Tv, Speaker, Thermometer, Printer, Gamepad2, HelpCircle, AlertTriangle } from "lucide-react";
import { deviceLabelToKey } from "@/lib/scenarioUtils";
import { formatMac } from "@/lib/macUtils";

interface TableViewProps {
  devices: Device[];
  networks: Network[];
  activeLayer: LayerMode;
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  showFullMac?: boolean;
}

const deviceIcons: Record<string, typeof Router> = {
  router: Router,
  server: Server,
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

export function TableView({ devices, networks, activeLayer, selectedDeviceId, onDeviceSelect, showFullMac = true }: TableViewProps) {
  const { t } = useTranslation();
  const getNetworkForDevice = (networkId: string) => networks.find(n => n.id === networkId);

  return (
    <ScrollArea className="h-full" data-testid="table-view">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>{t('tableView.name')}</TableHead>
            <TableHead>{t('tableView.type')}</TableHead>
            <TableHead>{t('tableView.network')}</TableHead>
            <TableHead>
              {activeLayer === "link"
                ? t(showFullMac ? 'tableView.macAddressFull' : 'tableView.macAddressShort')
                : t('tableView.ipAddress')}
            </TableHead>
            <TableHead>{t('tableView.status')}</TableHead>
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
                  {deviceLabelToKey[device.label] 
                    ? t(`deviceLabels.${deviceLabelToKey[device.label]}`, { defaultValue: device.label })
                    : device.label}
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {t(`deviceTypes.${device.type}`, device.type)}
                </TableCell>
                <TableCell>
                  {network ? (
                    <div>
                      <span className="text-sm">{network.ssid}</span>
                      <Badge variant="secondary" className="ml-2 text-xs capitalize">
                        {t(`zones.${network.zone}`, network.zone)}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">{t('common.noData')}</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {activeLayer === "link" ? formatMac(device.localId, showFullMac) : device.ip}
                </TableCell>
                <TableCell>
                  {hasRisks ? (
                    <div className="flex items-center gap-1.5 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs">
                        {t('tableView.issue', { count: device.riskFlags.length })}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">{t('tableView.ok')}</Badge>
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
