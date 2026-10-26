import { z } from "zod";

export const SCENARIO_LIMITS = {
  networks: 32,
  devices: 256,
  events: 256,
  learningPrompts: 128,
  answers: 16,
  scenarioTasks: 128,
  flows: 1024,
  riskFlags: 16,
  openPorts: 256,
  protocols: 64,
} as const;

export const deviceTypeSchema = z.enum([
  "router",
  "server",
  "laptop",
  "phone",
  "tablet",
  "camera",
  "smarttv",
  "speaker",
  "thermostat",
  "printer",
  "gaming",
  "unknown",
]);
export type DeviceType = z.infer<typeof deviceTypeSchema>;

export const riskFlagSchema = z.enum([
  "iot_device",
  "default_password",
  "outdated_firmware",
  "unknown_device",
  "unencrypted_traffic",
  "forgotten_device",
]);
export type RiskFlag = z.infer<typeof riskFlagSchema>;

export const securityTypeSchema = z.enum(["WPA2", "WPA3", "WEP", "Open"]);
export type SecurityType = z.infer<typeof securityTypeSchema>;

export const environmentTypeSchema = z.enum(["home", "business", "public"]);
export type EnvironmentType = z.infer<typeof environmentTypeSchema>;

export const scenarioActionTypeSchema = z.enum([
  "isolate_device",
  "change_password",
  "verify_ssid",
  "enable_guest",
  "block_unknown",
]);
export type ScenarioActionType = z.infer<typeof scenarioActionTypeSchema>;

export const scenarioTaskTargetSchema = z.object({
  type: z.enum(["device", "network", "none"]),
  id: z.string().optional(),
});
export type ScenarioTaskTarget = z.infer<typeof scenarioTaskTargetSchema>;

export const scenarioTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  instruction: z.string(),
  actionType: scenarioActionTypeSchema,
  target: scenarioTaskTargetSchema,
  successCopy: z.string(),
  failureCopy: z.string(),
  tipCopy: z.string(),
});
export type ScenarioTask = z.infer<typeof scenarioTaskSchema>;

export const flowCategorySchema = z.enum(["web", "video", "email", "chat", "remote", "file"]);
export type FlowCategory = z.infer<typeof flowCategorySchema>;

export const flowSchema = z.object({
  id: z.string(),
  srcDeviceId: z.string(),
  dstLabel: z.string(),
  protocol: z.string(),
  transport: z.enum(["TCP", "UDP"]),
  port: z.number(),
  encrypted: z.boolean(),
  category: flowCategorySchema,
});
export type Flow = z.infer<typeof flowSchema>;

export const networkSchema = z.object({
  id: z.string(),
  ssid: z.string(),
  security: securityTypeSchema,
  subnet: z.string(),
  zone: z.enum(["main", "guest", "iot"]),
});
export type Network = z.infer<typeof networkSchema>;

export const deviceSchema = z.object({
  id: z.string(),
  type: deviceTypeSchema,
  label: z.string(),
  networkId: z.string(),
  ip: z.string(),
  localId: z.string(),
  riskFlags: z.array(riskFlagSchema).max(SCENARIO_LIMITS.riskFlags),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  openPorts: z.array(z.number()).max(SCENARIO_LIMITS.openPorts).optional(),
  protocols: z.array(z.string()).max(SCENARIO_LIMITS.protocols).optional(),
});
export type Device = z.infer<typeof deviceSchema>;

export const environmentSchema = z.object({
  type: environmentTypeSchema,
  isp: z.string(),
  publicIp: z.string(),
});
export type Environment = z.infer<typeof environmentSchema>;

export const learningPromptAnswerSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean(),
});
export type LearningPromptAnswer = z.infer<typeof learningPromptAnswerSchema>;

export const learningPromptSchema = z.object({
  id: z.string(),
  question: z.string(),
  answers: z.array(learningPromptAnswerSchema).max(SCENARIO_LIMITS.answers),
  explanation: z.string(),
  why: z.string().optional(),
  nextStep: z.string().optional(),
  relatedLayer: z.enum(["link", "network", "transport", "application"]).optional(),
});
export type LearningPrompt = z.infer<typeof learningPromptSchema>;

export const eventSchema = z.object({
  id: z.string(),
  trigger: z.enum(["onEnter", "onDeviceClick", "onLayerChange"]),
  deviceId: z.string().optional(),
  message: z.string(),
});
export type NetworkEvent = z.infer<typeof eventSchema>;

export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  environment: environmentSchema,
  networks: z.array(networkSchema).max(SCENARIO_LIMITS.networks),
  devices: z.array(deviceSchema).max(SCENARIO_LIMITS.devices),
  events: z.array(eventSchema).max(SCENARIO_LIMITS.events),
  learningPrompts: z.array(learningPromptSchema).max(SCENARIO_LIMITS.learningPrompts),
  scenarioTasks: z.array(scenarioTaskSchema).max(SCENARIO_LIMITS.scenarioTasks).default([]),
  flows: z.array(flowSchema).max(SCENARIO_LIMITS.flows).default([]),
});
export type Scenario = z.infer<typeof scenarioSchema>;

export const layerModeSchema = z.enum(["link", "network", "transport", "application"]);
export type LayerMode = z.infer<typeof layerModeSchema>;
