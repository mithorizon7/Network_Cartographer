import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { Device, Network } from "@shared/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Filter, X, AlertTriangle, Wifi } from "lucide-react";

export interface DeviceFilters {
  searchQuery: string;
  deviceTypes: string[];
  networkZones: string[];
  showRisksOnly: boolean;
}

interface DeviceFilterProps {
  devices: Device[];
  networks: Network[];
  filters: DeviceFilters;
  onFiltersChange: (filters: DeviceFilters) => void;
}

export function useDeviceFilter(devices: Device[], networks: Network[], filters: DeviceFilters) {
  return useMemo(() => {
    let filtered = [...devices];

    if (filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(device => 
        device.label.toLowerCase().includes(query) ||
        device.ip.toLowerCase().includes(query) ||
        device.localId.toLowerCase().includes(query) ||
        device.type.toLowerCase().includes(query) ||
        device.manufacturer?.toLowerCase().includes(query) ||
        device.protocols?.some(p => p.toLowerCase().includes(query)) ||
        device.description?.toLowerCase().includes(query)
      );
    }

    if (filters.deviceTypes.length > 0) {
      filtered = filtered.filter(device => filters.deviceTypes.includes(device.type));
    }

    if (filters.networkZones.length > 0) {
      filtered = filtered.filter(device => {
        const network = networks.find(n => n.id === device.networkId);
        return network && filters.networkZones.includes(network.zone);
      });
    }

    if (filters.showRisksOnly) {
      filtered = filtered.filter(device => device.riskFlags.length > 0);
    }

    return filtered;
  }, [devices, networks, filters]);
}

export function DeviceFilter({ devices, networks, filters, onFiltersChange }: DeviceFilterProps) {
  const { t } = useTranslation();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const availableTypes = useMemo(() => {
    const types = new Set(devices.map(d => d.type));
    return Array.from(types).sort();
  }, [devices]);

  const availableZones = useMemo(() => {
    const zones = new Set(networks.map(n => n.zone));
    return Array.from(zones).sort();
  }, [networks]);

  const activeFilterCount = 
    (filters.deviceTypes.length > 0 ? 1 : 0) +
    (filters.networkZones.length > 0 ? 1 : 0) +
    (filters.showRisksOnly ? 1 : 0);

  const filteredCount = useDeviceFilter(devices, networks, filters).length;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.deviceTypes.includes(type)
      ? filters.deviceTypes.filter(t => t !== type)
      : [...filters.deviceTypes, type];
    onFiltersChange({ ...filters, deviceTypes: newTypes });
  };

  const handleZoneToggle = (zone: string) => {
    const newZones = filters.networkZones.includes(zone)
      ? filters.networkZones.filter(z => z !== zone)
      : [...filters.networkZones, zone];
    onFiltersChange({ ...filters, networkZones: newZones });
  };

  const handleRisksToggle = (checked: boolean) => {
    onFiltersChange({ ...filters, showRisksOnly: checked });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: "",
      deviceTypes: [],
      networkZones: [],
      showRisksOnly: false,
    });
  };

  const hasActiveFilters = filters.searchQuery || activeFilterCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={t('filter.searchPlaceholder')}
          value={filters.searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 pr-8"
          data-testid="input-device-search"
        />
        <AnimatePresence>
          {filters.searchQuery && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => handleSearchChange("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
              data-testid="button-clear-search"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5"
            data-testid="button-filter-toggle"
          >
            <Filter className="h-4 w-4" />
            {t('controls.filter')}
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{t('filter.filterDevices')}</h4>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="h-auto px-2 py-1 text-xs"
                  data-testid="button-clear-filters"
                >
                  {t('filter.clearAll')}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">{t('filter.deviceType')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableTypes.map(type => (
                  <Badge
                    key={type}
                    variant={filters.deviceTypes.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTypeToggle(type)}
                    data-testid={`filter-type-${type}`}
                  >
                    {t(`deviceTypes.${type}`, type)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">{t('filter.networkZone')}</Label>
              <div className="flex flex-wrap gap-1.5">
                {availableZones.map(zone => (
                  <Badge
                    key={zone}
                    variant={filters.networkZones.includes(zone) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleZoneToggle(zone)}
                    data-testid={`filter-zone-${zone}`}
                  >
                    <Wifi className="mr-1 h-3 w-3" />
                    {t(`zones.${zone}`, zone)}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="risks-only"
                checked={filters.showRisksOnly}
                onCheckedChange={handleRisksToggle}
                data-testid="filter-risks-only"
              />
              <Label 
                htmlFor="risks-only" 
                className="flex cursor-pointer items-center gap-1.5 text-sm"
              >
                <AlertTriangle className="h-4 w-4 text-destructive" />
                {t('filter.showRisksOnly')}
              </Label>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-xs text-muted-foreground"
            data-testid="filter-results-count"
          >
            {t('filter.resultsCount', { filtered: filteredCount, total: devices.length })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const defaultFilters: DeviceFilters = {
  searchQuery: "",
  deviceTypes: [],
  networkZones: [],
  showRisksOnly: false,
};
