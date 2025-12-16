import { z } from "zod";

export const deviceTypeSchema = z.enum([
  "router",
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
  riskFlags: z.array(riskFlagSchema),
  description: z.string().optional(),
  manufacturer: z.string().optional(),
  openPorts: z.array(z.number()).optional(),
  protocols: z.array(z.string()).optional(),
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
  answers: z.array(learningPromptAnswerSchema),
  explanation: z.string(),
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
  networks: z.array(networkSchema),
  devices: z.array(deviceSchema),
  events: z.array(eventSchema),
  learningPrompts: z.array(learningPromptSchema),
});
export type Scenario = z.infer<typeof scenarioSchema>;

export const layerModeSchema = z.enum(["link", "network", "transport", "application"]);
export type LayerMode = z.infer<typeof layerModeSchema>;

export const users = {} as any;
export const insertUserSchema = z.object({ username: z.string(), password: z.string() });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
