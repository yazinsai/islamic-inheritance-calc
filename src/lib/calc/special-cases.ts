import Fraction from "fraction.js";
import {
  HeirInput,
  HeirType,
  hasHeir,
  heirCount,
  hasOffspring,
  hasMultipleSiblings,
} from "./types";

const ZERO = new Fraction(0);
const ONE = new Fraction(1);
const ONE_SIXTH = new Fraction(1, 6);
const ONE_FOURTH = new Fraction(1, 4);
const ONE_THIRD = new Fraction(1, 3);
const ONE_HALF = new Fraction(1, 2);

/**
 * Check and apply the Umariyyah case (Rule 21).
 *
 * Condition: Spouse + Father + Mother, no offspring, no multiple siblings.
 * Father blocks all uncles/nephews/cousins, so their presence doesn't matter.
 *
 * Mother gets 1/3 of the REMAINDER (after spouse's share), not 1/3 of estate.
 * Father gets the rest.
 *
 * With husband: Husband 1/2, Mother 1/6, Father 1/3
 * With wife: Wife 1/4, Mother 1/4, Father 1/2
 */
export function applyUmariyyah(
  input: HeirInput,
  shares: Map<HeirType, { share: Fraction; explanation: string }>,
): boolean {
  if (hasOffspring(input)) return false;
  if (!hasHeir(input, "father")) return false;
  if (!hasHeir(input, "mother")) return false;
  if (hasMultipleSiblings(input)) return false;

  const hasHusband = hasHeir(input, "husband");
  const hasWife = hasHeir(input, "wife");
  if (!hasHusband && !hasWife) return false;

  // Umariyyah only applies when the effective heirs are father + mother + spouse.
  // Father blocks grandfather, grandmothers (paternal), siblings, nephews, uncles, cousins.
  // So we only check for heirs that father does NOT block:
  // - Any offspring (already checked above)
  // - Grandfather is blocked by father
  // - Grandmothers: paternal is blocked by father, maternal is blocked by mother
  // - Siblings: blocked by father
  // - Extended family: blocked by father
  // The only remaining check is if there are single siblings that don't qualify
  // as "multiple" but exist (mother's share wouldn't change for single sibling)
  // Actually, Rule 21c says multiple siblings invalidate Umariyyah (already checked).
  // Single siblings are blocked by father anyway.

  if (hasHusband) {
    shares.set("husband", {
      share: ONE_HALF,
      explanation: "Husband gets 1/2 (no offspring) (Rule 1a).",
    });
    shares.set("mother", {
      share: ONE_SIXTH,
      explanation:
        "Mother gets 1/3 of the remainder after husband's share = 1/3 × 1/2 = 1/6 (Umariyyah case, Rule 21).",
    });
    shares.set("father", {
      share: ONE_THIRD,
      explanation:
        "Father gets the remainder after husband and mother = 1/3 (Umariyyah case, Rule 21).",
    });
  } else {
    shares.set("wife", {
      share: ONE_FOURTH,
      explanation: "Wife gets 1/4 (no offspring) (Rule 2a).",
    });
    shares.set("mother", {
      share: ONE_FOURTH,
      explanation:
        "Mother gets 1/3 of the remainder after wife's share = 1/3 × 3/4 = 1/4 (Umariyyah case, Rule 21).",
    });
    shares.set("father", {
      share: ONE_HALF,
      explanation:
        "Father gets the remainder after wife and mother = 1/2 (Umariyyah case, Rule 21).",
    });
  }

  // Mark any blocked heirs with 0 share
  const blockedByFather: HeirType[] = [
    "grandfather",
    "paternal_grandmother",
    "full_brother",
    "full_sister",
    "paternal_brother",
    "paternal_sister",
    "maternal_brother",
    "maternal_sister",
    "full_nephew",
    "paternal_nephew",
    "full_uncle",
    "paternal_uncle",
    "full_cousin",
    "paternal_cousin",
    "paternal_cousins_grandson",
  ];

  for (const heir of blockedByFather) {
    if (hasHeir(input, heir)) {
      shares.set(heir, {
        share: ZERO,
        explanation: `${heir} is blocked by the presence of the father (Rule 13c).`,
      });
    }
  }

  // Maternal grandmother blocked by mother
  if (hasHeir(input, "maternal_grandmother")) {
    shares.set("maternal_grandmother", {
      share: ZERO,
      explanation: "Maternal grandmother is blocked by the presence of the mother.",
    });
  }

  return true;
}

/**
 * Check and apply the Mushtaraka case (Rule 22).
 */
export function applyMushtaraka(
  input: HeirInput,
  shares: Map<HeirType, { share: Fraction; explanation: string }>,
): boolean {
  if (!hasHeir(input, "full_brother")) return false;

  const hasMaternalSiblings =
    hasHeir(input, "maternal_brother") || hasHeir(input, "maternal_sister");
  if (!hasMaternalSiblings) return false;

  const fullBrotherShare = shares.get("full_brother");
  if (!fullBrotherShare || fullBrotherShare.share.compare(ZERO) !== 0)
    return false;

  const maternalBrotherShare = shares.get("maternal_brother");
  const maternalSisterShare = shares.get("maternal_sister");
  const maternalShare =
    maternalBrotherShare?.share ?? maternalSisterShare?.share ?? ZERO;
  if (maternalShare.compare(ZERO) <= 0) return false;

  const totalMaternal =
    heirCount(input, "maternal_brother") +
    heirCount(input, "maternal_sister");
  const totalFull = heirCount(input, "full_brother");
  const totalSharing = totalMaternal + totalFull;

  const fullBrotherPortion = maternalShare.mul(totalFull).div(totalSharing);
  const maternalPortion = maternalShare.mul(totalMaternal).div(totalSharing);

  shares.set("full_brother", {
    share: fullBrotherPortion,
    explanation: `Full brother(s) share equally with maternal siblings in their ${maternalShare.toFraction()} portion (Mushtaraka case, Rule 22).`,
  });

  if (maternalBrotherShare) {
    const mbCount = heirCount(input, "maternal_brother");
    shares.set("maternal_brother", {
      share: maternalPortion.mul(mbCount).div(totalMaternal),
      explanation: `Maternal brother(s) share their portion equally with full brothers (Mushtaraka case, Rule 22).`,
    });
  }
  if (maternalSisterShare) {
    const msCount = heirCount(input, "maternal_sister");
    shares.set("maternal_sister", {
      share: maternalPortion.mul(msCount).div(totalMaternal),
      explanation: `Maternal sister(s) share their portion equally with full brothers (Mushtaraka case, Rule 22).`,
    });
  }

  return true;
}

/**
 * Apply Awl (proportional reduction) when total shares exceed 1 (Rule 18).
 */
export function applyAwl(
  shares: Map<HeirType, { share: Fraction; explanation: string }>,
): boolean {
  let total = new Fraction(0);
  for (const [, { share }] of shares) {
    total = total.add(share);
  }

  if (total.compare(ONE) <= 0) return false;

  for (const [heir, data] of shares) {
    if (data.share.compare(ZERO) > 0) {
      const newShare = data.share.div(total);
      shares.set(heir, {
        share: newShare,
        explanation:
          data.explanation +
          ` Reduced proportionally from ${data.share.toFraction()} to ${newShare.toFraction()} due to Awl (Rule 18).`,
      });
    }
  }

  return true;
}

/**
 * Apply the Akdariyyah / Disturbing case (Rule 18a).
 *
 * When awl is applied AND grandfather AND sisters are present:
 * After proportional reduction, grandfather and sisters' combined share
 * is redistributed between them in 2:1 ratio.
 */
export function applyAkdariyyah(
  input: HeirInput,
  shares: Map<HeirType, { share: Fraction; explanation: string }>,
): boolean {
  if (!hasHeir(input, "grandfather")) return false;
  if (hasHeir(input, "father")) return false;

  // Check for sisters (full or paternal)
  const sisterTypes: HeirType[] = [];
  if (hasHeir(input, "full_sister")) sisterTypes.push("full_sister");
  if (hasHeir(input, "paternal_sister")) sisterTypes.push("paternal_sister");
  if (sisterTypes.length === 0) return false;

  // Get grandfather's share after awl
  const gfData = shares.get("grandfather");
  if (!gfData || gfData.share.compare(ZERO) <= 0) return false;

  // Calculate combined grandfather + sisters share
  let combinedShare = gfData.share;
  const sisterShares: { heir: HeirType; share: Fraction }[] = [];

  for (const sType of sisterTypes) {
    const sData = shares.get(sType);
    if (sData && sData.share.compare(ZERO) > 0) {
      combinedShare = combinedShare.add(sData.share);
      sisterShares.push({ heir: sType, share: sData.share });
    }
  }

  if (sisterShares.length === 0) return false;

  // Redistribute in 2:1 ratio (grandfather=2, each sister type=1 per sister)
  let totalSisterCount = 0;
  for (const s of sisterShares) {
    totalSisterCount += heirCount(input, s.heir);
  }

  const totalParts = 2 + totalSisterCount; // grandfather gets 2 parts
  const partValue = combinedShare.div(totalParts);

  const newGfShare = partValue.mul(2);
  shares.set("grandfather", {
    share: newGfShare,
    explanation: `Grandfather's share adjusted to ${newGfShare.toFraction()} via 2:1 redistribution with sisters (Akdariyyah case, Rule 18a).`,
  });

  for (const s of sisterShares) {
    const count = heirCount(input, s.heir);
    const newSisterShare = partValue.mul(count);
    shares.set(s.heir, {
      share: newSisterShare,
      explanation: `Sister share adjusted to ${newSisterShare.toFraction()} via 2:1 redistribution with grandfather (Akdariyyah case, Rule 18a).`,
    });
  }

  return true;
}

/**
 * Apply Radd (return of surplus) when total shares < 1 and no asaba heirs (Rule 19).
 */
export function applyRadd(
  input: HeirInput,
  shares: Map<HeirType, { share: Fraction; explanation: string }>,
): boolean {
  let total = new Fraction(0);
  for (const [, { share }] of shares) {
    total = total.add(share);
  }

  if (total.compare(ONE) >= 0) return false;

  const remaining = ONE.sub(total);

  const spouseHeirs: Set<HeirType> = new Set(["husband", "wife"]);
  let nonSpouseTotal = new Fraction(0);
  const nonSpouseHeirs: [HeirType, Fraction][] = [];

  for (const [heir, { share }] of shares) {
    if (!spouseHeirs.has(heir) && share.compare(ZERO) > 0) {
      nonSpouseTotal = nonSpouseTotal.add(share);
      nonSpouseHeirs.push([heir, share]);
    }
  }

  if (nonSpouseHeirs.length === 0) {
    for (const [heir, data] of shares) {
      if (data.share.compare(ZERO) > 0) {
        shares.set(heir, {
          share: ONE,
          explanation:
            data.explanation +
            ` Increased to full estate as the only heir (Radd).`,
        });
      }
    }
    return true;
  }

  for (const [heir, originalShare] of nonSpouseHeirs) {
    const proportion = originalShare.div(nonSpouseTotal);
    const raddPortion = remaining.mul(proportion);
    const newShare = originalShare.add(raddPortion);
    const existingData = shares.get(heir)!;

    shares.set(heir, {
      share: newShare,
      explanation:
        existingData.explanation +
        ` Increased from ${originalShare.toFraction()} to ${newShare.toFraction()} via Radd (Rule 19).`,
    });
  }

  return true;
}

/**
 * Apply the Grandfather-Siblings special case (Rule 23-24).
 *
 * When: No father, no offspring, grandfather exists with siblings.
 * Grandfather gets the maximum of:
 *   A = 1/6 of the entire estate
 *   B = 1/3 of the remainder (after non-sibling/non-grandfather prescribed shares)
 *   C = Share as if grandfather were a brother among the non-prescribed siblings
 *
 * Rule 23g: Full sisters/paternal sisters in the 2/3 zone (with prescribed shares)
 * are excluded from option C calculation. They keep their prescribed share.
 *
 * Rule 23e: If grandfather's share causes total to exceed 1, fall back to 1/6.
 */
export function applyGrandfatherSiblings(
  input: HeirInput,
  shares: Map<HeirType, { share: Fraction; explanation: string }>,
): boolean {
  if (hasHeir(input, "father")) return false;
  if (hasOffspring(input)) return false;
  if (!hasHeir(input, "grandfather")) return false;

  const hasSiblings =
    hasHeir(input, "full_brother") ||
    hasHeir(input, "full_sister") ||
    hasHeir(input, "paternal_brother") ||
    hasHeir(input, "paternal_sister");

  if (!hasSiblings) return false;

  // Calculate non-sibling, non-grandfather prescribed shares
  let fixedTotal = new Fraction(0);
  const nonSiblingHeirs: Set<HeirType> = new Set([
    "husband",
    "wife",
    "mother",
    "paternal_grandmother",
    "maternal_grandmother",
    "maternal_brother",
    "maternal_sister",
  ]);

  for (const [heir, { share }] of shares) {
    if (nonSiblingHeirs.has(heir) && share.compare(ZERO) > 0) {
      fixedTotal = fixedTotal.add(share);
    }
  }

  // Determine which sisters have prescribed shares (in the 2/3 zone - Rule 23g)
  // These sisters keep their prescribed share and are excluded from option C
  let fullSisterPrescribed = ZERO;
  let paternalSisterPrescribed = ZERO;

  // Full sister gets prescribed share if: no offspring, no father, no full_brother
  if (
    hasHeir(input, "full_sister") &&
    !hasHeir(input, "full_brother")
  ) {
    const fsCount = heirCount(input, "full_sister");
    if (fsCount === 1) {
      fullSisterPrescribed = ONE_HALF;
    } else if (fsCount >= 2) {
      fullSisterPrescribed = new Fraction(2, 3);
    }
  }

  // Paternal sister gets prescribed share if: no full sister (2+), no full brother, no paternal brother
  if (
    hasHeir(input, "paternal_sister") &&
    !hasHeir(input, "paternal_brother") &&
    !hasHeir(input, "full_brother")
  ) {
    const psCount = heirCount(input, "paternal_sister");
    const fsCount = heirCount(input, "full_sister");
    if (fsCount >= 2) {
      // Blocked by 2+ full sisters
      paternalSisterPrescribed = ZERO;
    } else if (fsCount === 1) {
      paternalSisterPrescribed = ONE_SIXTH;
    } else if (psCount === 1) {
      paternalSisterPrescribed = ONE_HALF;
    } else {
      paternalSisterPrescribed = new Fraction(2, 3);
    }
  }

  const totalPrescribedSisterShare = fullSisterPrescribed.add(
    paternalSisterPrescribed,
  );

  // Remainder for grandfather calculation (excluding sister prescribed shares per Rule 23g)
  const remainder = ONE.sub(fixedTotal);

  // Siblings participating in option C (those NOT in the 2/3 zone)
  const fullBrotherCount = heirCount(input, "full_brother");
  const fullSisterCount = heirCount(input, "full_sister");
  const paternalBrotherCount = heirCount(input, "paternal_brother");
  const paternalSisterCount = heirCount(input, "paternal_sister");

  // For option C: only count siblings that don't have a prescribed share
  let optionCParts = 2; // grandfather
  if (fullBrotherCount > 0) {
    // Full brothers never have prescribed share, they're always in asaba
    optionCParts += fullBrotherCount * 2;
    // When full brothers exist, full sisters join them in 2:1 ratio
    optionCParts += fullSisterCount;
  } else if (fullSisterPrescribed.compare(ZERO) === 0) {
    // Full sisters without prescribed share (shouldn't happen but defensive)
    optionCParts += fullSisterCount;
  }

  if (paternalBrotherCount > 0) {
    optionCParts += paternalBrotherCount * 2;
    optionCParts += paternalSisterCount;
  } else if (paternalSisterPrescribed.compare(ZERO) === 0) {
    optionCParts += paternalSisterCount;
  }

  // The remainder available for option C is after subtracting prescribed sister shares
  const remainderForC = remainder.sub(totalPrescribedSisterShare);

  // Option A: 1/6 of the entire estate
  const optionA = ONE_SIXTH;
  // Option B: 1/3 of the remainder (before sister prescribed shares)
  const optionB = remainder.mul(ONE_THIRD);
  // Option C: Grandfather's portion if treated as a brother (only with non-prescribed siblings)
  const optionC =
    optionCParts > 2 && remainderForC.compare(ZERO) > 0
      ? remainderForC.mul(2).div(optionCParts)
      : ZERO;

  // Pick the maximum
  let grandfatherShare = optionA;
  let method = "A (1/6 of estate)";

  if (optionB.compare(grandfatherShare) > 0) {
    grandfatherShare = optionB;
    method = "B (1/3 of remainder)";
  }
  if (optionC.compare(grandfatherShare) > 0) {
    grandfatherShare = optionC;
    method = "C (treated as brother)";
  }

  // Check if this causes total to exceed 1 (Rule 23e)
  const totalWithGrandfather = fixedTotal
    .add(grandfatherShare)
    .add(totalPrescribedSisterShare);
  if (totalWithGrandfather.compare(ONE) > 0) {
    grandfatherShare = ONE_SIXTH;
    method = "A (1/6, fallback because max would exceed total)";
  }

  // Set grandfather's share
  shares.set("grandfather", {
    share: grandfatherShare,
    explanation: `Grandfather gets ${grandfatherShare.toFraction()} using method ${method} (Grandfather-Siblings special case, Rule 23).`,
  });

  // Set prescribed sister shares
  if (fullSisterPrescribed.compare(ZERO) > 0) {
    shares.set("full_sister", {
      share: fullSisterPrescribed,
      explanation: `Full sister gets prescribed share of ${fullSisterPrescribed.toFraction()} (Rule 10).`,
    });
  }
  if (paternalSisterPrescribed.compare(ZERO) > 0) {
    shares.set("paternal_sister", {
      share: paternalSisterPrescribed,
      explanation: `Paternal sister gets prescribed share of ${paternalSisterPrescribed.toFraction()} (Rule 11).`,
    });
  }

  // Distribute remainder among non-prescribed siblings
  const remainderAfterAll = ONE.sub(
    fixedTotal
      .add(grandfatherShare)
      .add(totalPrescribedSisterShare),
  );

  if (remainderAfterAll.compare(ZERO) > 0) {
    // Count non-prescribed siblings for 2:1 distribution
    let siblingParts = 0;
    const siblingDistribution: { heir: HeirType; parts: number }[] = [];

    if (fullBrotherCount > 0) {
      siblingDistribution.push({
        heir: "full_brother",
        parts: fullBrotherCount * 2,
      });
      siblingParts += fullBrotherCount * 2;
      // Full sisters become asaba with full brothers (not prescribed)
      if (fullSisterCount > 0 && fullSisterPrescribed.compare(ZERO) === 0) {
        siblingDistribution.push({
          heir: "full_sister",
          parts: fullSisterCount,
        });
        siblingParts += fullSisterCount;
      }
    }

    if (paternalBrotherCount > 0) {
      siblingDistribution.push({
        heir: "paternal_brother",
        parts: paternalBrotherCount * 2,
      });
      siblingParts += paternalBrotherCount * 2;
      if (
        paternalSisterCount > 0 &&
        paternalSisterPrescribed.compare(ZERO) === 0
      ) {
        siblingDistribution.push({
          heir: "paternal_sister",
          parts: paternalSisterCount,
        });
        siblingParts += paternalSisterCount;
      }
    }

    if (siblingParts > 0) {
      const partValue = remainderAfterAll.div(siblingParts);
      for (const { heir, parts } of siblingDistribution) {
        const share = partValue.mul(parts);
        shares.set(heir, {
          share,
          explanation: `${heir} receives ${share.toFraction()} as residuary in the grandfather-siblings case.`,
        });
      }
    }
  } else {
    // No remainder for non-prescribed siblings
    const zeroSiblings: HeirType[] = [
      "full_brother",
      "full_sister",
      "paternal_brother",
      "paternal_sister",
    ];
    for (const heir of zeroSiblings) {
      if (hasHeir(input, heir) && !shares.has(heir)) {
        shares.set(heir, {
          share: ZERO,
          explanation: `${heir} gets nothing after grandfather's share.`,
        });
      }
    }
  }

  return true;
}
