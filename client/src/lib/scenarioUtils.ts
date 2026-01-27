export const scenarioIdToKey: Record<string, string> = {
  "family_iot_sprawl_v1": "familyIoT",
  "small_business_v1": "smallBusiness",
  "hotel_public_v1": "hotelPublic",
};

export function getScenarioTranslationKey(scenarioId: string): string | null {
  return scenarioIdToKey[scenarioId] || null;
}

export const deviceLabelToKey: Record<string, string> = {
  "Home Router": "homeRouter",
  "Work Laptop": "workLaptop",
  "Mom's iPhone": "momsIphone",
  "Kids' iPad": "kidsIpad",
  "Living Room TV": "livingRoomTv",
  "Indoor Camera": "indoorCamera",
  "Smart Thermostat": "smartThermostat",
  "Voice Assistant": "voiceAssistant",
  "Guest's Phone": "guestsPhone",
  "Generic Smart Controller": "genericSmartController",
  "Old Tablet (Inactive)": "oldTablet",
  "Office Router": "officeRouter",
  "File Server": "fileServer",
  "CEO's Laptop": "ceosLaptop",
  "Sales Laptop": "salesLaptop",
  "Work Phone": "workPhone",
  "Office Printer": "officePrinter",
  "Customer Device": "customerDevice",
  "Entrance Camera": "entranceCamera",
  "Unregistered Device": "unregisteredDevice",
  "Hotel Access Point": "hotelAccessPoint",
  "Your Laptop": "yourLaptop",
  "Unknown Guest": "unknownGuest",
  "Guest Phone": "guestPhone",
  "Suspicious Device": "suspiciousDevice",
  "Business Traveler": "businessTraveler",
  "Front Desk Computer": "frontDeskComputer",
  "GrandHotel_Free_WiFi": "grandHotelFreeWifi",
};

export const promptIdToKey: Record<string, string> = {
  "prompt_private_ip": "privateIp",
  "prompt_mac_purpose": "macPurpose",
  "prompt_guest_network": "guestNetwork",
  "prompt_unknown_device": "unknownDevice",
  "prompt_iot_isolation": "iotIsolation",
  "prompt_10_network": "tenNetwork",
  "prompt_wpa3": "wpa3",
  "prompt_printer_risk": "printerRisk",
  "prompt_corp_isolation": "corpIsolation",
  "prompt_open_wifi": "openWifi",
  "prompt_evil_twin": "evilTwin",
  "prompt_public_private_ip": "publicPrivateIp",
  "prompt_https_importance": "httpsImportance",
  "prompt_vpn": "vpn",
  "prompt_safe_behavior": "safeBehavior",
};

export const taskIdToKey: Record<string, string> = {
  "family_block_unknown": "familyIoT.blockUnknown",
  "family_change_camera_password": "familyIoT.changeCameraPassword",
  "family_enable_guest": "familyIoT.enableGuest",
  "business_enable_guest": "smallBusiness.enableGuest",
  "business_isolate_printer": "smallBusiness.isolatePrinter",
  "business_block_unknown": "smallBusiness.blockUnknown",
  "hotel_verify_ssid": "hotelPublic.verifySsid",
  "hotel_block_fake_ap": "hotelPublic.blockFakeAp",
};
