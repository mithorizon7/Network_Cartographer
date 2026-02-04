import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Device, Network, LayerMode } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Router,
  Server,
  Laptop,
  Smartphone,
  Tablet,
  Camera,
  Tv,
  Speaker,
  Thermometer,
  Printer,
  Gamepad2,
  HelpCircle,
  AlertTriangle,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { deviceLabelToKey } from "@/lib/scenarioUtils";
import { formatMac } from "@/lib/macUtils";

interface TableViewProps {
  devices: Device[];
  networks: Network[];
  activeLayer: LayerMode;
  selectedDeviceId: string | null;
  onDeviceSelect: (deviceId: string) => void;
  showFullMac?: boolean;
  highlightedDeviceIds?: Set<string>;
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

type SortKey = "name" | "type" | "network" | "address" | "status";
type SortDirection = "asc" | "desc";

export function TableView({
  devices,
  networks,
  activeLayer,
  selectedDeviceId,
  onDeviceSelect,
  showFullMac = true,
  highlightedDeviceIds,
}: TableViewProps) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const networkLookup = useMemo(
    () => new Map(networks.map((network) => [network.id, network])),
    [networks],
  );

  const sortedDevices = useMemo(() => {
    const sorted = [...devices];
    const direction = sortDirection === "asc" ? 1 : -1;
    sorted.sort((a, b) => {
      const aNetwork = networkLookup.get(a.networkId)?.ssid || "";
      const bNetwork = networkLookup.get(b.networkId)?.ssid || "";
      const aAddress = activeLayer === "link" ? formatMac(a.localId, showFullMac) : a.ip;
      const bAddress = activeLayer === "link" ? formatMac(b.localId, showFullMac) : b.ip;
      const aRisk = a.riskFlags.length;
      const bRisk = b.riskFlags.length;
      const aName = deviceLabelToKey[a.label]
        ? t(`deviceLabels.${deviceLabelToKey[a.label]}`, { defaultValue: a.label })
        : a.label;
      const bName = deviceLabelToKey[b.label]
        ? t(`deviceLabels.${deviceLabelToKey[b.label]}`, { defaultValue: b.label })
        : b.label;

      let comparison = 0;
      switch (sortKey) {
        case "name":
          comparison = aName.localeCompare(bName);
          break;
        case "type":
          comparison = a.type.localeCompare(b.type);
          break;
        case "network":
          comparison = aNetwork.localeCompare(bNetwork);
          break;
        case "address":
          comparison = aAddress.localeCompare(bAddress);
          break;
        case "status":
          comparison = aRisk - bRisk;
          break;
        default:
          comparison = 0;
      }
      return comparison * direction;
    });
    return sorted;
  }, [devices, activeLayer, showFullMac, sortKey, sortDirection, t, networkLookup]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="h-3.5 w-3.5" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  };

  return (
    <ScrollArea className="h-full" data-testid="table-view">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card/90 backdrop-blur">
          <TableRow className="bg-card/90">
            <TableHead className="w-12"></TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSort("name")}
              >
                {t("tableView.name")}
                {renderSortIcon("name")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSort("type")}
              >
                {t("tableView.type")}
                {renderSortIcon("type")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSort("network")}
              >
                {t("tableView.network")}
                {renderSortIcon("network")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSort("address")}
              >
                {activeLayer === "link"
                  ? t(showFullMac ? "tableView.macAddressFull" : "tableView.macAddressShort")
                  : t("tableView.ipAddress")}
                {renderSortIcon("address")}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => handleSort("status")}
              >
                {t("tableView.status")}
                {renderSortIcon("status")}
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDevices.map((device) => {
            const Icon = deviceIcons[device.type] || HelpCircle;
            const network = networkLookup.get(device.networkId);
            const hasRisks = device.riskFlags.length > 0;
            const isSelected = selectedDeviceId === device.id;
            const isHighlighted = highlightedDeviceIds
              ? highlightedDeviceIds.has(device.id)
              : false;

            return (
              <TableRow
                key={device.id}
                className={`cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : ""} ${isHighlighted ? "bg-primary/5 ring-1 ring-primary/30" : ""}`}
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
                  <div
                    className={`rounded-lg p-1.5 ${hasRisks ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </TableCell>
                <TableCell className="font-medium" data-testid={`text-device-label-${device.id}`}>
                  {deviceLabelToKey[device.label]
                    ? t(`deviceLabels.${deviceLabelToKey[device.label]}`, {
                        defaultValue: device.label,
                      })
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
                    <span className="text-muted-foreground">{t("common.noData")}</span>
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
                        {t("tableView.issue", { count: device.riskFlags.length })}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      {t("tableView.ok")}
                    </Badge>
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
