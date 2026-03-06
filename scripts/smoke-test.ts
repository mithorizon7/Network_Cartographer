import { allScenarios } from "../shared/scenarios";
import { scenarioSchema, type Scenario } from "../shared/schema";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertUnique(ids: string[], context: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    assert(!seen.has(id), `${context} contains duplicate id "${id}".`);
    seen.add(id);
  }
}

function validateScenarioIntegrity(scenario: Scenario) {
  const scenarioLabel = `Scenario ${scenario.id}`;
  const networkIds = new Set(scenario.networks.map((network) => network.id));
  const deviceIds = new Set(scenario.devices.map((device) => device.id));

  assertUnique(
    scenario.networks.map((network) => network.id),
    `${scenarioLabel} networks`,
  );
  assertUnique(
    scenario.devices.map((device) => device.id),
    `${scenarioLabel} devices`,
  );
  assertUnique(
    scenario.learningPrompts.map((prompt) => prompt.id),
    `${scenarioLabel} learningPrompts`,
  );
  assertUnique(
    scenario.events.map((event) => event.id),
    `${scenarioLabel} events`,
  );
  assertUnique(
    (scenario.flows ?? []).map((flow) => flow.id),
    `${scenarioLabel} flows`,
  );
  assertUnique(
    (scenario.scenarioTasks ?? []).map((task) => task.id),
    `${scenarioLabel} scenarioTasks`,
  );

  for (const device of scenario.devices) {
    assert(
      networkIds.has(device.networkId),
      `${scenarioLabel} device ${device.id} references missing network ${device.networkId}.`,
    );
  }

  for (const event of scenario.events) {
    if (event.deviceId) {
      assert(
        deviceIds.has(event.deviceId),
        `${scenarioLabel} event ${event.id} references missing device ${event.deviceId}.`,
      );
    }
  }

  for (const flow of scenario.flows ?? []) {
    assert(
      deviceIds.has(flow.srcDeviceId),
      `${scenarioLabel} flow ${flow.id} references missing source device ${flow.srcDeviceId}.`,
    );
  }

  for (const task of scenario.scenarioTasks ?? []) {
    if (task.target.type === "device" && task.target.id) {
      assert(
        deviceIds.has(task.target.id),
        `${scenarioLabel} task ${task.id} references missing device ${task.target.id}.`,
      );
    }
    if (task.target.type === "network" && task.target.id) {
      assert(
        networkIds.has(task.target.id),
        `${scenarioLabel} task ${task.id} references missing network ${task.target.id}.`,
      );
    }
  }

  for (const prompt of scenario.learningPrompts) {
    assert(
      prompt.answers.some((answer) => answer.isCorrect),
      `${scenarioLabel} prompt ${prompt.id} has no correct answer.`,
    );
  }
}

function main() {
  assert(allScenarios.length > 0, "No scenarios defined.");
  assertUnique(
    allScenarios.map((scenario) => scenario.id),
    "All scenarios",
  );

  for (const scenario of allScenarios) {
    const parseResult = scenarioSchema.safeParse(scenario);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      const path = firstError?.path.join(".") || "root";
      throw new Error(
        `Scenario ${scenario.id} failed schema validation at "${path}": ${firstError?.message || "unknown error"}.`,
      );
    }

    assert(!!scenario.id, "Scenario missing id.");
    assert(!!scenario.title, `Scenario ${scenario.id} missing title.`);
    assert(scenario.networks.length > 0, `Scenario ${scenario.id} has no networks.`);
    assert(scenario.devices.length > 0, `Scenario ${scenario.id} has no devices.`);
    assert(scenario.learningPrompts.length > 0, `Scenario ${scenario.id} has no prompts.`);
    validateScenarioIntegrity(parseResult.data);
  }

  console.log("Smoke test passed.");
}

main();
