import { describe, it, expect } from "vitest";
import Fraction from "fraction.js";
import { calculate } from "@/lib/calc/calculator";
import { HeirInput, HeirType, ILMSUMMIT_HEIR_MAP } from "@/lib/calc/types";
import testCases from "../../test-cases.json";
import testCaseInputs from "../../test-case-inputs.json";

interface TestCaseExpected {
  heir: string;
  fraction: string;
  percentage: string;
}

interface TestCase {
  id: number;
  shares_by_category: TestCaseExpected[];
  shares_by_individual?: TestCaseExpected[];
  calculation_steps: string[];
  error?: string;
}

/**
 * Convert ilmsummit heir names to our internal types.
 */
function convertInputs(
  ilmsummitInputs: Record<string, number>,
): HeirInput {
  const result: HeirInput = {};
  for (const [name, count] of Object.entries(ilmsummitInputs)) {
    const heirType = ILMSUMMIT_HEIR_MAP[name];
    if (heirType) {
      result[heirType] = count;
    } else {
      console.warn(`Unknown heir type: ${name}`);
    }
  }
  return result;
}

/**
 * Parse a fraction string like "3/7" or "1/1" into a Fraction.
 */
function parseFraction(str: string): Fraction {
  if (str.includes("/")) {
    const [num, den] = str.split("/").map(Number);
    return new Fraction(num, den);
  }
  return new Fraction(Number(str));
}

/**
 * Convert ilmsummit heir names back.
 */
const REVERSE_HEIR_MAP: Record<string, HeirType> = {};
for (const [key, value] of Object.entries(ILMSUMMIT_HEIR_MAP)) {
  REVERSE_HEIR_MAP[key] = value;
}

describe("IlmSummit Test Cases", () => {
  const inputs = testCaseInputs as Record<string, Record<string, number>>;
  const cases = testCases as TestCase[];

  for (const tc of cases) {
    // Skip empty test case 29
    if (!tc.shares_by_category || tc.shares_by_category.length === 0) continue;
    if (tc.error) continue;

    const inputStr = JSON.stringify(inputs[String(tc.id)] || {});

    it(`Test Case #${tc.id}: ${inputStr}`, () => {
      const ilmsummitInput = inputs[String(tc.id)];
      if (!ilmsummitInput || Object.keys(ilmsummitInput).length === 0) {
        return; // Skip empty inputs
      }

      const heirInput = convertInputs(ilmsummitInput);
      const result = calculate(heirInput);

      // Build a map of expected shares by heir category
      const expected = new Map<string, Fraction>();
      for (const s of tc.shares_by_category) {
        expected.set(s.heir, parseFraction(s.fraction));
      }

      // Build a map of actual shares by heir
      const actual = new Map<HeirType, Fraction>();
      for (const share of result.shares) {
        actual.set(share.heir, share.totalShare);
      }

      // Compare each expected heir
      for (const [ilmsummitName, expectedFraction] of expected) {
        const heirType = REVERSE_HEIR_MAP[ilmsummitName];
        if (!heirType) {
          throw new Error(`Unknown heir in test case: ${ilmsummitName}`);
        }

        const actualFraction = actual.get(heirType) ?? new Fraction(0);

        // Compare fractions - they should be equal
        expect(
          actualFraction.equals(expectedFraction),
          `Heir ${ilmsummitName} (${heirType}): expected ${expectedFraction.toFraction()}, got ${actualFraction.toFraction()}`,
        ).toBe(true);
      }

      // Also verify total doesn't exceed 1 (with small tolerance for rounding)
      let total = new Fraction(0);
      for (const share of result.shares) {
        total = total.add(share.totalShare);
      }
      expect(
        total.compare(new Fraction(1)) <= 0 ||
          total.sub(new Fraction(1)).abs().compare(new Fraction(1, 10000)) < 0,
        `Total shares ${total.toFraction()} should not significantly exceed 1`,
      ).toBe(true);
    });
  }
});
