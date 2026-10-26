import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createInstance } from "i18next";
import { allScenarios } from "../shared/scenarios";
import { scenarioSchema, SCENARIO_LIMITS } from "../shared/schema";
import { validateScenario } from "../client/src/lib/scenarioImport";

const i18n = createInstance();
const resources: Record<string, { translation: object }> = {};
for (const locale of ["en", "lv", "ru"]) {
  resources[locale] = {
    translation: JSON.parse(
      await readFile(new URL(`../client/src/i18n/locales/${locale}.json`, import.meta.url), "utf8"),
    ),
  };
}
await i18n.init({ resources, lng: "en", fallbackLng: "en", interpolation: { escapeValue: false } });
const t = i18n.getFixedT("en");

test("every shipped scenario survives JSON export/import without input mutation", () => {
  for (const scenario of allScenarios) {
    const data = JSON.parse(JSON.stringify(scenario));
    const before = structuredClone(data);
    const result = validateScenario(data, t);
    assert.equal(result.valid, true, result.error);
    assert.deepEqual(data, before);
    assert.deepEqual(result.scenario, scenarioSchema.parse(data));
  }
});

test("Zod 4 issue paths reject malformed imports without crashing", () => {
  for (const data of [null, [], {}, { ...allScenarios[0], devices: "not an array" }]) {
    const result = validateScenario(data, t);
    assert.equal(result.valid, false);
    assert.equal(typeof result.error, "string");
    assert(!result.error?.includes("scenarioExportImport."));
  }
});

test("bounded top-level collections reject a one-item overflow in every locale", () => {
  for (const key of [
    "networks",
    "devices",
    "events",
    "learningPrompts",
    "scenarioTasks",
    "flows",
  ] as const) {
    const original = allScenarios.find((scenario) => scenario[key].length > 0);
    assert(original, `Fixture required for ${key}`);
    const data = { ...original, [key]: Array(SCENARIO_LIMITS[key] + 1).fill(original[key][0]) };
    const parsed = scenarioSchema.safeParse(data);
    assert.equal(parsed.success, false);
    if (parsed.success) throw new Error("Expected collection limit failure");
    assert(parsed.error.issues.some((issue) => issue.code === "too_big" && issue.path[0] === key));
    for (const locale of ["en", "lv", "ru"]) {
      const translate = i18n.getFixedT(locale);
      const result = validateScenario(data, translate);
      assert.equal(result.valid, false);
      assert.equal(
        result.error,
        translate("scenarioExportImport.tooManyItems", {
          path: key,
          max: SCENARIO_LIMITS[key],
        }),
      );
    }
  }
});

test("nested answers, ports, protocols and flags have finite collection bounds", () => {
  const scenario = structuredClone(allScenarios[0]);
  scenario.learningPrompts[0].answers = Array(SCENARIO_LIMITS.answers + 1).fill({
    text: "Choice",
    isCorrect: false,
  });
  assert.equal(scenarioSchema.safeParse(scenario).success, false);
  for (const key of ["riskFlags", "openPorts", "protocols"] as const) {
    const data = structuredClone(allScenarios[0]);
    const value = key === "riskFlags" ? "iot_device" : key === "openPorts" ? 443 : "HTTPS";
    Object.assign(data.devices[0], { [key]: Array(SCENARIO_LIMITS[key] + 1).fill(value) });
    assert.equal(scenarioSchema.safeParse(data).success, false, key);
  }
});

test("defaults and cross-reference guards survive the major-version migration", () => {
  const data = { ...allScenarios[0], flows: undefined, scenarioTasks: undefined };
  const parsed = scenarioSchema.parse(data);
  assert.deepEqual(parsed.flows, []);
  assert.deepEqual(parsed.scenarioTasks, []);
  const duplicate = structuredClone(allScenarios[0]);
  duplicate.devices.push(structuredClone(duplicate.devices[0]));
  assert.equal(validateScenario(duplicate, t).valid, false);
  const orphan = structuredClone(allScenarios[0]);
  orphan.devices[0].networkId = "missing-network";
  assert.equal(validateScenario(orphan, t).valid, false);
  const noAnswer = structuredClone(allScenarios[0]);
  noAnswer.learningPrompts[0].answers.forEach((answer) => {
    answer.isCorrect = false;
  });
  assert.equal(validateScenario(noAnswer, t).valid, false);
});
