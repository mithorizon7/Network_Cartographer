import { allScenarios } from "../shared/scenarios";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  assert(allScenarios.length > 0, "No scenarios defined.");

  for (const scenario of allScenarios) {
    assert(!!scenario.id, "Scenario missing id.");
    assert(!!scenario.title, `Scenario ${scenario.id} missing title.`);
    assert(scenario.networks.length > 0, `Scenario ${scenario.id} has no networks.`);
    assert(scenario.devices.length > 0, `Scenario ${scenario.id} has no devices.`);
    assert(scenario.learningPrompts.length > 0, `Scenario ${scenario.id} has no prompts.`);
  }

  console.log("Smoke test passed.");
}

main();
