import Fraction from "fraction.js";
import {
  HeirInput,
  HeirType,
  ExplanationTemplate,
  hasHeir,
  heirCount,
  hasOffspring,
} from "./types";

const ZERO = new Fraction(0);

/**
 * Asaba (residuary) heir ranking.
 * Based on ilmsummit Rule 14.
 *
 * Lower rank number = higher priority.
 * Only the highest-priority available asaba heir(s) inherit.
 *
 * Male-female pairs at the same rank share with 2:1 ratio (Rule 15).
 */
interface AsabaRank {
  rank: number;
  male: HeirType | null;
  female: HeirType | null;
}

const ASABA_RANKS: AsabaRank[] = [
  { rank: 1, male: "son", female: "daughter" },
  { rank: 2, male: "grandson", female: "granddaughter" },
  { rank: 3, male: "father", female: null },
  { rank: 4, male: "full_brother", female: "full_sister" },
  { rank: 5, male: "paternal_brother", female: "paternal_sister" },
  { rank: 6, male: "grandfather", female: null },
  { rank: 7, male: "full_nephew", female: null },
  { rank: 8, male: "paternal_nephew", female: null },
  { rank: 9, male: "full_uncle", female: null },
  { rank: 10, male: "paternal_uncle", female: null },
  { rank: 11, male: "full_cousin", female: null },
  { rank: 12, male: "paternal_cousin", female: null },
  { rank: 13, male: "paternal_cousins_grandson", female: null },
];

/**
 * Heirs that cannot be asaba (Rule 43).
 */
const NON_ASABA_HEIRS: Set<HeirType> = new Set([
  "mother",
  "paternal_grandmother",
  "maternal_grandmother",
  "husband",
  "wife",
  "maternal_brother",
  "maternal_sister",
]);

interface AsabaResult {
  heir: HeirType;
  maleCount: number;
  femaleCount: number;
  /** The female heir type that shares in 2:1 ratio, if any */
  femaleHeirType: HeirType | null;
  explanation: ExplanationTemplate;
}

/**
 * Determine which heirs qualify for asaba (residuary) inheritance.
 *
 * Also handles the special case where sisters become asaba with female offspring
 * (asaba ma'a ghayriha - Rule 30e).
 *
 * @param input The heir counts
 * @param fardHeirs Set of heirs that already received fard shares (to check father exception, Rule 16)
 * @returns The qualifying asaba heir(s) and their distribution info
 */
export function determineAsabaHeirs(
  input: HeirInput,
  fardHeirs: Set<HeirType>,
): AsabaResult | null {
  // Father is special (Rule 16-17): he can receive both fard AND asaba
  // Other heirs who received fard drop from asaba consideration

  // Check for "asaba ma'a ghayriha" (sisters becoming residuary with daughters)
  // Rule 30e: Female offspring gets female siblings out of 2/3 zone
  // This means sisters become residuary when there are daughters but no sons
  const hasFemaleOffspringOnly =
    (hasHeir(input, "daughter") || hasHeir(input, "granddaughter")) &&
    !hasHeir(input, "son") &&
    !hasHeir(input, "grandson");

  for (const rank of ASABA_RANKS) {
    let maleCount = 0;
    let femaleCount = 0;
    let femaleHeirType: HeirType | null = null;

    // Check if male heir at this rank exists and qualifies
    if (rank.male) {
      const count = heirCount(input, rank.male);
      if (count > 0) {
        // Rule 16: If heir received fard, they drop from asaba UNLESS they are father
        if (rank.male === "father") {
          // Father is ALWAYS asaba (Rule 16 exception, Rule 17)
          maleCount = count;
        } else if (fardHeirs.has(rank.male)) {
          // Already received fard, skip
          continue;
        } else {
          maleCount = count;
        }
      }
    }

    // Check if female heir at this rank exists and qualifies
    if (rank.female) {
      const count = heirCount(input, rank.female);
      if (count > 0 && !fardHeirs.has(rank.female)) {
        // Females at these ranks only become asaba if:
        // 1. Male counterpart exists at the same rank (joint asaba, Rule 15), OR
        // 2. Sisters become asaba with female offspring (Rule 30e)
        if (maleCount > 0) {
          femaleCount = count;
          femaleHeirType = rank.female;
        } else if (
          hasFemaleOffspringOnly &&
          (rank.female === "full_sister" || rank.female === "paternal_sister")
        ) {
          // Sisters become residuary with female offspring
          // Only if they haven't been blocked
          if (
            !hasHeir(input, "father") &&
            !(
              rank.female === "paternal_sister" &&
              hasHeir(input, "full_brother")
            )
          ) {
            femaleCount = count;
            femaleHeirType = rank.female;
          }
        }
      }
    }

    if (maleCount > 0 || femaleCount > 0) {
      let explanation: ExplanationTemplate;
      if (maleCount > 0 && femaleCount > 0) {
        explanation = { key: "explain.asaba.twoToOne" };
      } else if (maleCount > 0) {
        explanation = { key: "explain.asaba.remainder" };
      } else {
        explanation = { key: "explain.asaba.withFemaleOffspring" };
      }

      return {
        heir: rank.male ?? rank.female!,
        maleCount,
        femaleCount,
        femaleHeirType,
        explanation,
      };
    }
  }

  return null;
}

/**
 * Calculate how the residuary amount is distributed among asaba heirs.
 *
 * @param remaining The amount remaining after fard shares
 * @param asaba The qualifying asaba heir(s)
 * @returns Map of heir type to their asaba share
 */
export function distributeAsaba(
  remaining: Fraction,
  asaba: AsabaResult,
): Map<HeirType, { share: Fraction; explanation: ExplanationTemplate }> {
  const result = new Map<
    HeirType,
    { share: Fraction; explanation: ExplanationTemplate }
  >();

  if (remaining.compare(ZERO) <= 0) {
    // No remainder to distribute
    if (asaba.maleCount > 0 && asaba.heir) {
      result.set(asaba.heir, {
        share: ZERO,
        explanation: { key: "explain.asaba.noRemainder" },
      });
    }
    if (asaba.femaleCount > 0 && asaba.femaleHeirType) {
      result.set(asaba.femaleHeirType, {
        share: ZERO,
        explanation: { key: "explain.asaba.noRemainder" },
      });
    }
    return result;
  }

  if (asaba.femaleCount === 0) {
    // Only male heirs (or only female heirs becoming asaba with offspring)
    const totalHeirType = asaba.maleCount > 0 ? asaba.heir : asaba.femaleHeirType!;
    result.set(totalHeirType, {
      share: remaining,
      explanation: asaba.maleCount > 0
        ? { key: "explain.asaba.remainingHighest", vars: { fraction: remaining.toFraction() } }
        : { key: "explain.asaba.remainingWithFemale", vars: { fraction: remaining.toFraction() } },
    });
  } else if (asaba.maleCount === 0 && asaba.femaleCount > 0) {
    // Only female heirs as asaba (sisters with daughters)
    result.set(asaba.femaleHeirType!, {
      share: remaining,
      explanation: { key: "explain.asaba.remainingWithFemale", vars: { fraction: remaining.toFraction() } },
    });
  } else {
    // Both male and female: 2:1 ratio (Rule 15)
    const totalParts =
      asaba.maleCount * 2 + asaba.femaleCount;
    const partValue = remaining.div(totalParts);

    const maleTotal = partValue.mul(asaba.maleCount * 2);
    const femaleTotal = partValue.mul(asaba.femaleCount);

    result.set(asaba.heir, {
      share: maleTotal,
      explanation: { key: "explain.asaba.maleShare", vars: { fraction: maleTotal.toFraction() } },
    });

    result.set(asaba.femaleHeirType!, {
      share: femaleTotal,
      explanation: { key: "explain.asaba.femaleShare", vars: { fraction: femaleTotal.toFraction() } },
    });
  }

  return result;
}
