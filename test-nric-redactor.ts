import { redactNric, redactExtractedData } from "./src/lib/nric-redactor";
import type { RawExtractedData } from "./src/types";

// Test 1: Full NRIC redaction
const result1 = redactNric("Patient S1234567A visited the clinic");
console.log("Test 1 (full NRIC):", result1);
console.assert(result1.redactedText === "Patient [REDACTED] visited the clinic");
console.assert(result1.redactionCount === 1);

// Test 2: Multiple NRICs
const result2 = redactNric("IDs: T9876543Z and F1234567B");
console.log("Test 2 (multiple):", result2);
console.assert(result2.redactionCount === 2);

// Test 3: Partial NRIC (5 digits)
const result3 = redactNric("Partial: S12345A reference");
console.log("Test 3 (partial 5-digit):", result3);
console.assert(result3.redactionCount === 1);
console.assert(result3.redactedText === "Partial: [REDACTED] reference");

// Test 4: Partial NRIC (4 digits)
const result4 = redactNric("Short: G1234Z in text");
console.log("Test 4 (partial 4-digit):", result4);
console.assert(result4.redactionCount === 1);

// Test 5: Case insensitive prefix
const result5 = redactNric("Lower case: s1234567a");
console.log("Test 5 (lowercase):", result5);
console.assert(result5.redactionCount === 1);

// Test 6: Empty string
const result6 = redactNric("");
console.log("Test 6 (empty):", result6);
console.assert(result6.redactionCount === 0);
console.assert(result6.redactedText === "");

// Test 7: No NRIC
const result7 = redactNric("No NRIC patterns here");
console.log("Test 7 (no NRIC):", result7);
console.assert(result7.redactionCount === 0);

// Test 8: Fail-closed on null
try {
  redactNric(null as unknown as string);
  console.log("Test 8: FAIL - should have thrown");
} catch (e: unknown) {
  const err = e as Error;
  console.log("Test 8 (null input):", err.name, "-", err.message);
  console.assert(err.name === "NricRedactionError");
}

// Test 9: redactExtractedData
const rawData: RawExtractedData = {
  medicalCodes: ["ICD-10 S1234567A"],
  diagnoses: ["Diabetes for patient T9876543B"],
  visitDate: "2024-01-15",
  institution: "NUH",
  rawText: "Patient F1234567C visited NUH on 2024-01-15",
  prescriptions: [],
  bill: null,
};
const result9 = redactExtractedData(rawData);
console.log("Test 9 (extractedData):", JSON.stringify(result9, null, 2));
console.assert(!result9.rawText.includes("F1234567C"));
console.assert(!result9.medicalCodes[0].includes("S1234567A"));
console.assert(!result9.diagnoses[0].includes("T9876543B"));

// Test 10: Fail-closed on null data
try {
  redactExtractedData(null as unknown as RawExtractedData);
  console.log("Test 10: FAIL - should have thrown");
} catch (e: unknown) {
  const err = e as Error;
  console.log("Test 10 (null data):", err.name, "-", err.message);
  console.assert(err.name === "NricRedactionError");
}

console.log("\nAll tests passed!");
