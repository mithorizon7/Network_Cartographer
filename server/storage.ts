import type { Scenario } from "@shared/schema";
import { familyIoTScenario, smallBusinessScenario, hotelPublicScenario } from "@shared/scenarios";

export interface IStorage {
  getAllScenarios(): Promise<Scenario[]>;
  getScenarioById(id: string): Promise<Scenario | undefined>;
}

export class MemStorage implements IStorage {
  private scenarios: Map<string, Scenario>;

  constructor() {
    this.scenarios = new Map();
    this.scenarios.set(familyIoTScenario.id, familyIoTScenario);
    this.scenarios.set(smallBusinessScenario.id, smallBusinessScenario);
    this.scenarios.set(hotelPublicScenario.id, hotelPublicScenario);
  }

  async getAllScenarios(): Promise<Scenario[]> {
    return Array.from(this.scenarios.values());
  }

  async getScenarioById(id: string): Promise<Scenario | undefined> {
    return this.scenarios.get(id);
  }
}

export const storage = new MemStorage();
