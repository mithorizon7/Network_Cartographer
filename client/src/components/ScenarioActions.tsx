import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Device, Scenario, ScenarioActionType, ScenarioTask } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  Wifi,
  Users,
  Ban,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { deviceLabelToKey, taskIdToKey } from "@/lib/scenarioUtils";

interface ScenarioActionsProps {
  scenario: Scenario;
  selectedDevice: Device | null;
  resetKey?: number;
  onTaskChange?: (task: ScenarioTask | null, isComplete: boolean) => void;
  onActionComplete?: (outcome: ActionOutcome) => void;
}

const actionIcons: Record<ScenarioActionType, typeof ShieldCheck> = {
  isolate_device: ShieldCheck,
  change_password: KeyRound,
  verify_ssid: Wifi,
  enable_guest: Users,
  block_unknown: Ban,
};

export interface ActionOutcome {
  taskId: string;
  actionType: ScenarioActionType;
  target: ScenarioTask["target"];
  message: string;
}

export function ScenarioActions({
  scenario,
  selectedDevice,
  resetKey = 0,
  onTaskChange,
  onActionComplete,
}: ScenarioActionsProps) {
  const { t } = useTranslation();
  const tasks = scenario.scenarioTasks ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "success" | "failure">("idle");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showDebrief, setShowDebrief] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setCompletedIds(new Set());
    setStatus("idle");
    setFeedback(null);
    setShowDebrief(false);
  }, [scenario.id, resetKey]);

  const safeIndex = currentIndex < tasks.length ? currentIndex : 0;
  const currentTask = tasks[safeIndex];
  const isComplete = completedIds.size === tasks.length && tasks.length > 0;
  const isLastTask = safeIndex === tasks.length - 1;
  const progress =
    tasks.length > 0 ? ((safeIndex + (status === "success" ? 1 : 0)) / tasks.length) * 100 : 0;

  useEffect(() => {
    onTaskChange?.(currentTask ?? null, isComplete);
  }, [currentTask, isComplete, onTaskChange]);

  const getTaskText = (
    task: ScenarioTask,
    field: "title" | "instruction" | "success" | "failure" | "tip",
  ) => {
    const taskKey = taskIdToKey[task.id];
    const fallbackValue =
      field === "title"
        ? task.title
        : field === "instruction"
          ? task.instruction
          : field === "success"
            ? task.successCopy
            : field === "failure"
              ? task.failureCopy
              : task.tipCopy;
    if (!taskKey) {
      return fallbackValue;
    }
    return t(`scenarioTasks.${taskKey}.${field}`, {
      defaultValue: fallbackValue,
    });
  };

  const getDeviceLabel = useCallback(
    (deviceId?: string) => {
      if (!deviceId) return t("common.noData");
      const device = scenario.devices.find((d) => d.id === deviceId);
      if (!device) return t("common.noData");
      return deviceLabelToKey[device.label]
        ? t(`deviceLabels.${deviceLabelToKey[device.label]}`, { defaultValue: device.label })
        : device.label;
    },
    [scenario.devices, t],
  );

  const getNetworkLabel = useCallback(
    (networkId?: string) => {
      if (!networkId) return t("common.noData");
      const network = scenario.networks.find((n) => n.id === networkId);
      return network?.ssid || networkId;
    },
    [scenario.networks, t],
  );

  const requirementText = useMemo(() => {
    if (!currentTask) return null;
    if (currentTask.target.type === "device") {
      return t("actions.requireDevice", { device: getDeviceLabel(currentTask.target.id) });
    }
    if (currentTask.target.type === "network") {
      return t("actions.requireNetwork", { network: getNetworkLabel(currentTask.target.id) });
    }
    return t("actions.requireNone");
  }, [currentTask, t, getDeviceLabel, getNetworkLabel]);

  const isTargetMatch = useMemo(() => {
    if (!currentTask) return false;
    if (currentTask.target.type === "none") return true;
    if (!selectedDevice) return false;
    if (currentTask.target.type === "device") {
      return selectedDevice.id === currentTask.target.id;
    }
    if (currentTask.target.type === "network") {
      return selectedDevice.networkId === currentTask.target.id;
    }
    return false;
  }, [currentTask, selectedDevice]);

  const selectedDeviceId = selectedDevice?.id;
  const selectedNetworkId = selectedDevice?.networkId;
  const selectionKey = useMemo(() => {
    if (!selectedDeviceId) return "none";
    return `${selectedDeviceId}:${selectedNetworkId}`;
  }, [selectedDeviceId, selectedNetworkId]);

  const selectionKeyRef = useRef<string>("none");

  useEffect(() => {
    if (selectionKeyRef.current !== selectionKey) {
      if (status === "failure") {
        setStatus("idle");
        setFeedback(null);
      }
      selectionKeyRef.current = selectionKey;
    }
  }, [selectionKey, status]);

  const handleComplete = () => {
    if (!currentTask) return;
    if (isTargetMatch) {
      setCompletedIds((prev) => new Set(prev).add(currentTask.id));
      setStatus("success");
      const successMessage = getTaskText(currentTask, "success");
      setFeedback(successMessage);
      onActionComplete?.({
        taskId: currentTask.id,
        actionType: currentTask.actionType,
        target: currentTask.target,
        message: successMessage,
      });
    } else {
      setStatus("failure");
      setFeedback(getTaskText(currentTask, "failure"));
    }
  };

  const handleNext = () => {
    if (isLastTask) {
      setShowDebrief(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setStatus("idle");
    setFeedback(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCompletedIds(new Set());
    setStatus("idle");
    setFeedback(null);
    setShowDebrief(false);
  };

  if (!currentTask || tasks.length === 0) {
    return null;
  }

  if (showDebrief && isComplete) {
    return (
      <Card data-testid="scenario-debrief">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("actions.debriefTitle")}</h3>
            <Badge variant="secondary">{t("actions.complete")}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{t("actions.debriefIntro")}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("actions.yourActions")}
            </p>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div key={task.id} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-500" />
                  <span>{getTaskText(task, "title")}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("actions.keyTakeaways")}
            </p>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={`${task.id}-tip`}
                  className="rounded-md border border-primary/10 bg-primary/5 p-2 text-xs"
                >
                  {getTaskText(task, "tip")}
                </div>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={handleRestart} data-testid="button-restart-actions">
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("actions.restart")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const ActionIcon = actionIcons[currentTask.actionType] || ShieldCheck;

  return (
    <Card data-testid="scenario-actions">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ActionIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("actions.title")}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {t("actions.progress", { current: safeIndex + 1, total: tasks.length })}
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-1.5" />
        {safeIndex === 0 && completedIds.size === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">{t("actions.startHereBody")}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Badge variant="secondary" className="text-xs">
            {t(`actionTypes.${currentTask.actionType}`, { defaultValue: currentTask.actionType })}
          </Badge>
          <h4 className="text-sm font-semibold">{getTaskText(currentTask, "title")}</h4>
          <p className="text-xs text-muted-foreground">{getTaskText(currentTask, "instruction")}</p>
        </div>

        {requirementText && (
          <div className="rounded-md border border-dashed border-muted-foreground/20 bg-muted/40 px-3 py-2 text-xs">
            {requirementText}
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-md border px-3 py-2 text-xs ${
              status === "success"
                ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}
          >
            <div className="flex items-start gap-2">
              {status === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4" />
              )}
              <span>{feedback}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {status !== "success" && (
            <Button onClick={handleComplete} data-testid="button-complete-action">
              {t("actions.completeAction")}
            </Button>
          )}
          {status === "success" && (
            <Button onClick={handleNext} data-testid="button-next-action">
              {isLastTask ? t("actions.viewDebrief") : t("actions.nextAction")}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
          {status === "failure" && (
            <Button
              variant="outline"
              onClick={() => {
                setStatus("idle");
                setFeedback(null);
              }}
              data-testid="button-try-again"
            >
              {t("actions.tryAgain")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
