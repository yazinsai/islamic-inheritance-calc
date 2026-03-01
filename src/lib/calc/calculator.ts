import Fraction from "fraction.js";
import {
  HeirInput,
  HeirType,
  HeirShare,
  CalculationResult,
  ExplanationTemplate,
  hasHeir,
  heirCount,
  hasOffspring,
} from "./types";
import { calculateFard } from "./fard";
import { determineAsabaHeirs, distributeAsaba } from "./asaba";
import {
  applyUmariyyah,
  applyMushtaraka,
  applyAwl,
  applyAkdariyyah,
  applyRadd,
  applyGrandfatherSiblings,
} from "./special-cases";

const ZERO = new Fraction(0);
const ONE = new Fraction(1);

/**
 * Main calculation function.
 * Follows the pipeline: Fard → Asaba → Special Cases
 */
export function calculate(input: HeirInput): CalculationResult {
  // Validate input
  if (hasHeir(input, "husband") && hasHeir(input, "wife")) {
    throw new Error("Cannot have both husband and wife as heirs.");
  }

  const steps: ExplanationTemplate[] = [];
  const allShares = new Map<
    HeirType,
    { share: Fraction; explanation: ExplanationTemplate; shareType: "fard" | "asaba" | "fard+asaba" }
  >();

  let awlApplied = false;
  let raddApplied = false;
  let umariyyahApplied = false;
  let mushtarakaApplied = false;
  let grandfatherSiblingsApplied = false;

  // Step 1: Check for Umariyyah case first (it overrides normal fard)
  const umariyyahShares = new Map<
    HeirType,
    { share: Fraction; explanation: ExplanationTemplate }
  >();
  umariyyahApplied = applyUmariyyah(input, umariyyahShares);

  if (umariyyahApplied) {
    steps.push({ key: "step.umariyyah" });
    for (const [heir, data] of umariyyahShares) {
      allShares.set(heir, { ...data, shareType: "fard" });
      steps.push({ key: "step.heirGets", vars: { heir, fraction: data.share.toFraction() } });
    }

    return buildResult(input, allShares, steps, {
      awlApplied,
      raddApplied,
      umariyyahApplied,
      mushtarakaApplied,
      grandfatherSiblingsApplied,
    });
  }

  // Step 2: Check for Grandfather-Siblings special case
  if (
    hasHeir(input, "grandfather") &&
    !hasHeir(input, "father") &&
    !hasOffspring(input) &&
    (hasHeir(input, "full_brother") ||
      hasHeir(input, "full_sister") ||
      hasHeir(input, "paternal_brother") ||
      hasHeir(input, "paternal_sister"))
  ) {
    // First calculate non-sibling, non-grandfather fard shares
    const fardShares = calculateFard(input);
    for (const [heir, data] of fardShares) {
      if (
        heir !== "grandfather" &&
        heir !== "full_brother" &&
        heir !== "full_sister" &&
        heir !== "paternal_brother" &&
        heir !== "paternal_sister"
      ) {
        allShares.set(heir, { ...data, shareType: "fard" });
        if (data.share.compare(ZERO) > 0) {
          steps.push({
            key: "step.prescribed",
            vars: { heir, fraction: data.share.toFraction() },
          });
        }
      }
    }

    // Apply grandfather-siblings special case
    const gfShares = new Map<
      HeirType,
      { share: Fraction; explanation: ExplanationTemplate }
    >();
    // Copy non-sibling shares for the calculation
    for (const [heir, data] of allShares) {
      gfShares.set(heir, { share: data.share, explanation: data.explanation });
    }

    grandfatherSiblingsApplied = applyGrandfatherSiblings(input, gfShares);

    if (grandfatherSiblingsApplied) {
      steps.push({ key: "step.grandfatherSiblings" });
      // Copy grandfather and sibling shares back
      for (const [heir, data] of gfShares) {
        if (
          heir === "grandfather" ||
          heir === "full_brother" ||
          heir === "full_sister" ||
          heir === "paternal_brother" ||
          heir === "paternal_sister"
        ) {
          allShares.set(heir, { ...data, shareType: "fard" });
          steps.push({
            key: "step.heirGets",
            vars: { heir, fraction: data.share.toFraction() },
          });
        }
      }

      // Check if awl is needed
      let total = new Fraction(0);
      for (const [, data] of allShares) {
        total = total.add(data.share);
      }
      if (total.compare(ONE) > 0) {
        const awlShares = new Map<HeirType, { share: Fraction; explanation: ExplanationTemplate }>();
        for (const [heir, data] of allShares) {
          awlShares.set(heir, { share: data.share, explanation: data.explanation });
        }
        awlApplied = applyAwl(awlShares);
        if (awlApplied) {
          steps.push({ key: "step.awl" });
          for (const [heir, data] of awlShares) {
            allShares.set(heir, { ...data, shareType: allShares.get(heir)!.shareType });
          }

          // Akdariyyah / Disturbing case (Rule 18a) - after awl with grandfather + sisters
          const akdMap = new Map<HeirType, { share: Fraction; explanation: ExplanationTemplate }>();
          for (const [heir, data] of allShares) {
            akdMap.set(heir, { share: data.share, explanation: data.explanation });
          }
          const akdariyyahApplied = applyAkdariyyah(input, akdMap);
          if (akdariyyahApplied) {
            steps.push({ key: "step.akdariyyah" });
            for (const [heir, data] of akdMap) {
              const existing = allShares.get(heir);
              if (existing) {
                allShares.set(heir, { ...data, shareType: existing.shareType });
              }
            }
          }
        }
      }

      return buildResult(input, allShares, steps, {
        awlApplied,
        raddApplied,
        umariyyahApplied,
        mushtarakaApplied,
        grandfatherSiblingsApplied,
      });
    }
  }

  // Step 3: Calculate Fard (prescribed shares)
  const fardShares = calculateFard(input);
  const fardHeirSet = new Set<HeirType>();

  for (const [heir, data] of fardShares) {
    allShares.set(heir, { ...data, shareType: "fard" });
    fardHeirSet.add(heir);
    if (data.share.compare(ZERO) > 0) {
      steps.push({
        key: "step.prescribed",
        vars: { heir, fraction: data.share.toFraction() },
      });
    } else {
      steps.push({
        key: "step.blocked",
        vars: { heir, explanation: data.explanation.key },
      });
    }
  }

  // Step 4: Calculate remaining for asaba
  let fardTotal = new Fraction(0);
  for (const [, data] of allShares) {
    fardTotal = fardTotal.add(data.share);
  }

  const remaining = ONE.sub(fardTotal);

  // Step 5: Determine and distribute asaba shares
  const asabaResult = determineAsabaHeirs(input, fardHeirSet);

  if (asabaResult && remaining.compare(ZERO) > 0) {
    steps.push({
      key: "step.distributeResiduary",
      vars: { fraction: remaining.toFraction() },
    });
    const asabaShares = distributeAsaba(remaining, asabaResult);

    for (const [heir, data] of asabaShares) {
      if (allShares.has(heir)) {
        // Father can have both fard and asaba (Rule 16)
        const existing = allShares.get(heir)!;
        allShares.set(heir, {
          share: existing.share.add(data.share),
          explanation: { ...data.explanation, prefix: existing.explanation },
          shareType: "fard+asaba",
        });
      } else {
        allShares.set(heir, { ...data, shareType: "asaba" });
      }
      steps.push({
        key: "step.residuary",
        vars: { heir, fraction: data.share.toFraction() },
      });
    }
  } else if (asabaResult && remaining.compare(ZERO) <= 0) {
    // Asaba heirs exist but nothing left
    // Mark them with 0 share
    if (asabaResult.maleCount > 0) {
      if (!allShares.has(asabaResult.heir)) {
        allShares.set(asabaResult.heir, {
          share: ZERO,
          explanation: { key: "explain.asaba.noRemainder" },
          shareType: "asaba",
        });
      }
    }
    if (asabaResult.femaleCount > 0 && asabaResult.femaleHeirType) {
      if (!allShares.has(asabaResult.femaleHeirType)) {
        allShares.set(asabaResult.femaleHeirType, {
          share: ZERO,
          explanation: { key: "explain.asaba.noRemainder" },
          shareType: "asaba",
        });
      }
    }
  }

  // Step 6: Handle heirs that are present in input but not yet in shares
  // (these are heirs that were blocked - add them with 0 share)
  for (const [heirStr, count] of Object.entries(input)) {
    const heir = heirStr as HeirType;
    if (count && count > 0 && !allShares.has(heir)) {
      allShares.set(heir, {
        share: ZERO,
        explanation: { key: "explain.noShare", vars: { heir } },
        shareType: "fard",
      });
    }
  }

  // Step 7: Apply special cases

  // Mushtaraka (Rule 22)
  const mushtarakaMap = new Map<
    HeirType,
    { share: Fraction; explanation: ExplanationTemplate }
  >();
  for (const [heir, data] of allShares) {
    mushtarakaMap.set(heir, { share: data.share, explanation: data.explanation });
  }
  mushtarakaApplied = applyMushtaraka(input, mushtarakaMap);
  if (mushtarakaApplied) {
    steps.push({ key: "step.mushtaraka" });
    for (const [heir, data] of mushtarakaMap) {
      const existing = allShares.get(heir);
      if (existing) {
        allShares.set(heir, { ...data, shareType: existing.shareType });
      }
    }
  }

  // Awl (Rule 18)
  let total = new Fraction(0);
  for (const [, data] of allShares) {
    total = total.add(data.share);
  }

  if (total.compare(ONE) > 0) {
    const awlMap = new Map<
      HeirType,
      { share: Fraction; explanation: ExplanationTemplate }
    >();
    for (const [heir, data] of allShares) {
      awlMap.set(heir, { share: data.share, explanation: data.explanation });
    }
    awlApplied = applyAwl(awlMap);
    if (awlApplied) {
      steps.push({ key: "step.awl" });
      for (const [heir, data] of awlMap) {
        const existing = allShares.get(heir);
        if (existing) {
          allShares.set(heir, { ...data, shareType: existing.shareType });
        }
      }

      // Akdariyyah / Disturbing case (Rule 18a)
      // When awl applies and grandfather + sisters are present,
      // redistribute their combined share in 2:1 ratio
      const akdMap = new Map<HeirType, { share: Fraction; explanation: ExplanationTemplate }>();
      for (const [heir, data] of allShares) {
        akdMap.set(heir, { share: data.share, explanation: data.explanation });
      }
      const akdariyyahApplied = applyAkdariyyah(input, akdMap);
      if (akdariyyahApplied) {
        steps.push({ key: "step.akdariyyah" });
        for (const [heir, data] of akdMap) {
          const existing = allShares.get(heir);
          if (existing) {
            allShares.set(heir, { ...data, shareType: existing.shareType });
          }
        }
      }
    }
  }

  // Radd (Rule 19) - only if no asaba heirs and total < 1
  total = new Fraction(0);
  for (const [, data] of allShares) {
    total = total.add(data.share);
  }

  if (total.compare(ONE) < 0 && !asabaResult) {
    const raddMap = new Map<
      HeirType,
      { share: Fraction; explanation: ExplanationTemplate }
    >();
    for (const [heir, data] of allShares) {
      raddMap.set(heir, { share: data.share, explanation: data.explanation });
    }
    raddApplied = applyRadd(input, raddMap);
    if (raddApplied) {
      steps.push({ key: "step.radd" });
      for (const [heir, data] of raddMap) {
        const existing = allShares.get(heir);
        if (existing) {
          allShares.set(heir, { ...data, shareType: existing.shareType });
        }
      }
    }
  }

  return buildResult(input, allShares, steps, {
    awlApplied,
    raddApplied,
    umariyyahApplied,
    mushtarakaApplied,
    grandfatherSiblingsApplied,
  });
}

function buildResult(
  input: HeirInput,
  allShares: Map<
    HeirType,
    { share: Fraction; explanation: ExplanationTemplate; shareType: "fard" | "asaba" | "fard+asaba" }
  >,
  steps: ExplanationTemplate[],
  flags: {
    awlApplied: boolean;
    raddApplied: boolean;
    umariyyahApplied: boolean;
    mushtarakaApplied: boolean;
    grandfatherSiblingsApplied: boolean;
  },
): CalculationResult {
  const shares: HeirShare[] = [];

  for (const [heir, data] of allShares) {
    const count = heirCount(input, heir);
    if (count === 0) continue;

    const individualShare =
      count > 0 ? data.share.div(count) : new Fraction(0);

    shares.push({
      heir,
      count,
      shareType: data.shareType,
      totalShare: data.share,
      individualShare,
      explanation: data.explanation,
    });
  }

  return {
    shares,
    steps,
    ...flags,
  };
}
