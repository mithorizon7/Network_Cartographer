import type { TFunction } from "i18next";
import { scenarioSchema, type Scenario } from "@shared/schema";

export const MAX_IMPORT_CHARACTERS = 500_000;
export const MAX_IMPORT_FILE_BYTES = 500_000;

function findScenarioIntegrityErrorPath(scenario: Scenario): string | null {
  const networkIds = new Set<string>();
  for (let i = 0; i < scenario.networks.length; i += 1) {
    const network = scenario.networks[i];
    if (networkIds.has(network.id)) {
      return `networks[${i}].id`;
    }
    networkIds.add(network.id);
  }

  const deviceIds = new Set<string>();
  for (let i = 0; i < scenario.devices.length; i += 1) {
    const device = scenario.devices[i];
    if (deviceIds.has(device.id)) {
      return `devices[${i}].id`;
    }
    deviceIds.add(device.id);

    if (!networkIds.has(device.networkId)) {
      return `devices[${i}].networkId`;
    }
  }

  const promptIds = new Set<string>();
  for (let i = 0; i < scenario.learningPrompts.length; i += 1) {
    const prompt = scenario.learningPrompts[i];
    if (promptIds.has(prompt.id)) {
      return `learningPrompts[${i}].id`;
    }
    promptIds.add(prompt.id);

    const hasCorrectAnswer = prompt.answers.some((answer) => answer.isCorrect);
    if (!hasCorrectAnswer) {
      return `learningPrompts[${i}].answers`;
    }
  }

  const eventIds = new Set<string>();
  for (let i = 0; i < scenario.events.length; i += 1) {
    const event = scenario.events[i];
    if (eventIds.has(event.id)) {
      return `events[${i}].id`;
    }
    eventIds.add(event.id);

    if (event.deviceId && !deviceIds.has(event.deviceId)) {
      return `events[${i}].deviceId`;
    }
  }

  const flowIds = new Set<string>();
  for (let i = 0; i < scenario.flows.length; i += 1) {
    const flow = scenario.flows[i];
    if (flowIds.has(flow.id)) {
      return `flows[${i}].id`;
    }
    flowIds.add(flow.id);

    if (!deviceIds.has(flow.srcDeviceId)) {
      return `flows[${i}].srcDeviceId`;
    }
  }

  const taskIds = new Set<string>();
  for (let i = 0; i < scenario.scenarioTasks.length; i += 1) {
    const task = scenario.scenarioTasks[i];
    if (taskIds.has(task.id)) {
      return `scenarioTasks[${i}].id`;
    }
    taskIds.add(task.id);

    if (task.target.type === "device" && task.target.id && !deviceIds.has(task.target.id)) {
      return `scenarioTasks[${i}].target.id`;
    }

    if (task.target.type === "network" && task.target.id && !networkIds.has(task.target.id)) {
      return `scenarioTasks[${i}].target.id`;
    }
  }

  return null;
}

export function validateScenario(
  data: unknown,
  t: TFunction,
): { valid: boolean; error?: string; scenario?: Scenario } {
  const result = scenarioSchema.safeParse(data);

  if (!result.success) {
    const firstError = result.error.issues[0];
    const path =
      firstError && firstError.path.length > 0
        ? firstError.path.map(String).join(".")
        : t("scenarioExportImport.validationRoot");
    return {
      valid: false,
      error:
        firstError?.code === "too_big" && firstError.origin === "array"
          ? t("scenarioExportImport.tooManyItems", { path, max: Number(firstError.maximum) })
          : t("scenarioExportImport.validationError", { path }),
    };
  }

  const scenario = result.data;

  if (scenario.devices.length === 0) {
    return { valid: false, error: t("scenarioExportImport.requiresDevice") };
  }

  if (scenario.networks.length === 0) {
    return { valid: false, error: t("scenarioExportImport.requiresNetwork") };
  }

  const hasRouter = scenario.devices.some((d) => d.type === "router");
  if (!hasRouter) {
    return { valid: false, error: t("scenarioExportImport.requiresRouter") };
  }

  const integrityErrorPath = findScenarioIntegrityErrorPath(scenario);
  if (integrityErrorPath) {
    return {
      valid: false,
      error: t("scenarioExportImport.validationError", { path: integrityErrorPath }),
    };
  }

  return { valid: true, scenario };
}
