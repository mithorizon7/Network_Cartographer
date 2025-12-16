export const scenarioIdToKey: Record<string, string> = {
  "family_iot_sprawl_v1": "familyIoT",
  "small_business_v1": "smallBusiness",
  "hotel_public_v1": "hotelPublic",
};

export function getScenarioTranslationKey(scenarioId: string): string | null {
  return scenarioIdToKey[scenarioId] || null;
}
