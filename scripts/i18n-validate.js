#!/usr/bin/env node

/**
 * i18n Validation Script
 *
 * Validates that all translation files have matching keys and no empty values.
 * This ensures Latvian and Russian translations stay in sync with English.
 *
 * Checks performed:
 * 1. Key parity: All keys in English must exist in LV and RU
 * 2. No empty values: All translations must have non-empty content
 * 3. Placeholder consistency: ICU placeholders ({{var}}) must match across languages
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.join(__dirname, "..", "client", "src", "i18n", "locales");
const REQUIRED_LOCALES = ["en", "lv", "ru"];
const BASE_LOCALE = "en";

function loadLocale(locale) {
  const filePath = path.join(LOCALES_DIR, `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load ${locale}.json: ${error.message}`);
    process.exit(1);
  }
}

function flattenObject(obj, prefix = "") {
  const result = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }

  return result;
}

function extractPlaceholders(text) {
  if (typeof text !== "string") return [];
  const matches = text.match(/\{\{[^}]+\}\}/g) || [];
  return matches.sort();
}

const PLURAL_SUFFIXES = ["_zero", "_one", "_two", "_few", "_many", "_other"];

function isPluralKey(key) {
  return PLURAL_SUFFIXES.some((suffix) => key.endsWith(suffix));
}

function getBasePluralKey(key) {
  for (const suffix of PLURAL_SUFFIXES) {
    if (key.endsWith(suffix)) {
      return key.slice(0, -suffix.length);
    }
  }
  return key;
}

function validateKeyParity(baseKeys, targetKeys, targetLocale) {
  const errors = [];
  const missingKeys = [];
  const extraKeys = [];

  const basePluralBases = new Set();
  const targetPluralBases = new Set();

  for (const key of Object.keys(baseKeys)) {
    if (isPluralKey(key)) {
      basePluralBases.add(getBasePluralKey(key));
    }
  }

  for (const key of Object.keys(targetKeys)) {
    if (isPluralKey(key)) {
      targetPluralBases.add(getBasePluralKey(key));
    }
  }

  for (const key of Object.keys(baseKeys)) {
    if (!(key in targetKeys)) {
      if (isPluralKey(key)) {
        const baseKey = getBasePluralKey(key);
        if (targetPluralBases.has(baseKey)) {
          continue;
        }
      }
      missingKeys.push(key);
    }
  }

  for (const key of Object.keys(targetKeys)) {
    if (!(key in baseKeys)) {
      if (isPluralKey(key)) {
        const baseKey = getBasePluralKey(key);
        if (basePluralBases.has(baseKey)) {
          continue;
        }
      }
      extraKeys.push(key);
    }
  }

  if (missingKeys.length > 0) {
    errors.push({
      type: "missing_keys",
      locale: targetLocale,
      keys: missingKeys,
      message: `${targetLocale.toUpperCase()} is missing ${missingKeys.length} key(s)`,
    });
  }

  if (extraKeys.length > 0) {
    errors.push({
      type: "extra_keys",
      locale: targetLocale,
      keys: extraKeys,
      message: `${targetLocale.toUpperCase()} has ${extraKeys.length} extra key(s) not in base locale`,
    });
  }

  return errors;
}

function validateEmptyValues(keys, locale) {
  const errors = [];
  const emptyKeys = [];

  for (const [key, value] of Object.entries(keys)) {
    if (value === "" || value === null || value === undefined) {
      emptyKeys.push(key);
    }
  }

  if (emptyKeys.length > 0) {
    errors.push({
      type: "empty_values",
      locale: locale,
      keys: emptyKeys,
      message: `${locale.toUpperCase()} has ${emptyKeys.length} empty value(s)`,
    });
  }

  return errors;
}

function validatePlaceholders(baseKeys, targetKeys, targetLocale) {
  const errors = [];
  const mismatchedKeys = [];

  for (const [key, baseValue] of Object.entries(baseKeys)) {
    if (!(key in targetKeys)) continue;

    const basePlaceholders = extractPlaceholders(baseValue);
    const targetPlaceholders = extractPlaceholders(targetKeys[key]);

    if (JSON.stringify(basePlaceholders) !== JSON.stringify(targetPlaceholders)) {
      mismatchedKeys.push({
        key,
        base: basePlaceholders,
        target: targetPlaceholders,
      });
    }
  }

  if (mismatchedKeys.length > 0) {
    errors.push({
      type: "placeholder_mismatch",
      locale: targetLocale,
      keys: mismatchedKeys,
      message: `${targetLocale.toUpperCase()} has ${mismatchedKeys.length} placeholder mismatch(es)`,
    });
  }

  return errors;
}

function main() {
  console.log("i18n Validation");
  console.log("================\n");

  const locales = {};
  const flattenedLocales = {};

  for (const locale of REQUIRED_LOCALES) {
    console.log(`Loading ${locale}.json...`);
    locales[locale] = loadLocale(locale);
    flattenedLocales[locale] = flattenObject(locales[locale]);
  }

  console.log(
    `\nBase locale: ${BASE_LOCALE} (${Object.keys(flattenedLocales[BASE_LOCALE]).length} keys)\n`,
  );

  const allErrors = [];
  const baseKeys = flattenedLocales[BASE_LOCALE];

  for (const locale of REQUIRED_LOCALES) {
    if (locale === BASE_LOCALE) continue;

    const targetKeys = flattenedLocales[locale];
    console.log(`Validating ${locale.toUpperCase()} (${Object.keys(targetKeys).length} keys)...`);

    allErrors.push(...validateKeyParity(baseKeys, targetKeys, locale));
    allErrors.push(...validateEmptyValues(targetKeys, locale));
    allErrors.push(...validatePlaceholders(baseKeys, targetKeys, locale));
  }

  console.log("");

  if (allErrors.length === 0) {
    console.log("All translations are valid!");
    console.log(`- ${REQUIRED_LOCALES.length} locales checked`);
    console.log(`- ${Object.keys(baseKeys).length} keys validated`);
    console.log("- No missing keys");
    console.log("- No empty values");
    console.log("- All placeholders match");
    process.exit(0);
  }

  console.log("Validation Errors Found:\n");

  for (const error of allErrors) {
    console.log(`[${error.type.toUpperCase()}] ${error.message}`);

    if (
      error.type === "missing_keys" ||
      error.type === "extra_keys" ||
      error.type === "empty_values"
    ) {
      for (const key of error.keys.slice(0, 10)) {
        console.log(`  - ${key}`);
      }
      if (error.keys.length > 10) {
        console.log(`  ... and ${error.keys.length - 10} more`);
      }
    }

    if (error.type === "placeholder_mismatch") {
      for (const item of error.keys.slice(0, 5)) {
        console.log(`  - ${item.key}`);
        console.log(`    Base: ${JSON.stringify(item.base)}`);
        console.log(`    ${error.locale.toUpperCase()}: ${JSON.stringify(item.target)}`);
      }
      if (error.keys.length > 5) {
        console.log(`  ... and ${error.keys.length - 5} more`);
      }
    }

    console.log("");
  }

  console.log(`Total: ${allErrors.length} error(s) found`);
  console.log("\nFix these issues before merging.");
  process.exit(1);
}

main();
