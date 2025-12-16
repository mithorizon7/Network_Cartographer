import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import type { NetworkEvent, Device } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, X, Info } from "lucide-react";
import { scenarioIdToKey } from "@/lib/scenarioUtils";

interface EventNotificationsProps {
  events: NetworkEvent[];
  devices: Device[];
  scenarioId: string;
  selectedDeviceId: string | null;
  onDismiss?: () => void;
}

const eventIdToKey: Record<string, string> = {
  "unknown_device_reveal": "unknownDeviceReveal",
  "unknown_device_alert": "unknownDeviceAlert",
  "evil_twin_warning": "evilTwinWarning",
};

export function EventNotifications({
  events,
  devices,
  scenarioId,
  selectedDeviceId,
  onDismiss,
}: EventNotificationsProps) {
  const { t } = useTranslation();
  const [activeEvent, setActiveEvent] = useState<NetworkEvent | null>(null);
  const [dismissedEvents, setDismissedEvents] = useState<Set<string>>(new Set());
  const [shownOnEnterEvents, setShownOnEnterEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDismissedEvents(new Set());
    setShownOnEnterEvents(new Set());
    setActiveEvent(null);
  }, [scenarioId]);

  useEffect(() => {
    const onEnterEvents = events.filter(
      (e) => e.trigger === "onEnter" && !shownOnEnterEvents.has(e.id) && !dismissedEvents.has(e.id)
    );

    if (onEnterEvents.length > 0) {
      const timer = setTimeout(() => {
        setActiveEvent(onEnterEvents[0]);
        setShownOnEnterEvents((prev) => new Set(prev).add(onEnterEvents[0].id));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [events, shownOnEnterEvents, dismissedEvents, scenarioId]);

  useEffect(() => {
    if (!selectedDeviceId) return;

    const clickEvent = events.find(
      (e) =>
        e.trigger === "onDeviceClick" &&
        e.deviceId === selectedDeviceId &&
        !dismissedEvents.has(e.id)
    );

    if (clickEvent) {
      setActiveEvent(clickEvent);
    }
  }, [selectedDeviceId, events, dismissedEvents]);

  const handleDismiss = useCallback(() => {
    if (activeEvent) {
      setDismissedEvents((prev) => new Set(prev).add(activeEvent.id));
    }
    setActiveEvent(null);
    onDismiss?.();
  }, [activeEvent, onDismiss]);

  const getEventDevice = (event: NetworkEvent): Device | undefined => {
    return devices.find((d) => d.id === event.deviceId);
  };

  const getTranslatedMessage = (event: NetworkEvent): string => {
    const scenarioKey = scenarioIdToKey[scenarioId];
    const eventKey = eventIdToKey[event.id];
    
    if (scenarioKey && eventKey) {
      const translationKey = `scenarioContent.${scenarioKey}.events.${eventKey}`;
      const translated = t(translationKey, { defaultValue: "" });
      if (translated && translated !== translationKey) {
        return translated;
      }
    }
    return event.message;
  };

  if (!activeEvent) return null;

  const device = getEventDevice(activeEvent);
  const isWarning = device?.riskFlags.includes("unknown_device") || device?.type === "unknown";
  const message = getTranslatedMessage(activeEvent);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
        className="fixed left-1/2 top-20 z-50 w-full max-w-md -translate-x-1/2 px-4"
        data-testid="event-notification"
      >
        <Card
          className={`relative overflow-hidden border-2 p-4 shadow-lg ${
            isWarning ? "border-destructive/50 bg-card" : "border-primary/50 bg-card"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 rounded-full p-2 ${
                isWarning ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
              }`}
            >
              {isWarning ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <Info className="h-5 w-5" />
              )}
            </div>
            <div className="flex-1">
              {device && (
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {device.label}
                </p>
              )}
              <p className="text-sm leading-relaxed" data-testid="event-message">
                {message}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="shrink-0"
              data-testid="button-dismiss-event"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
