import Fraction from "fraction.js";
import {
  HeirInput,
  HeirType,
  hasHeir,
  heirCount,
  hasOffspring,
  hasMaleOffspring,
  hasMalePaternalAncestor,
  hasMultipleSiblings,
} from "./types";

const ZERO = new Fraction(0);
const ONE_SIXTH = new Fraction(1, 6);
const ONE_FOURTH = new Fraction(1, 4);
const ONE_THIRD = new Fraction(1, 3);
const ONE_HALF = new Fraction(1, 2);
const TWO_THIRDS = new Fraction(2, 3);
const ONE_EIGHTH = new Fraction(1, 8);
const ONE_TWELFTH = new Fraction(1, 12);

interface FardResult {
  share: Fraction;
  explanation: string;
}

/**
 * Calculate prescribed (fard) shares for all heirs.
 * Returns shares for heirs that receive fard, and marks those that
 * will instead receive via asaba (residuary).
 *
 * Based on ilmsummit.org Rules 1-12.
 */
export function calculateFard(input: HeirInput): Map<HeirType, FardResult> {
  const result = new Map<HeirType, FardResult>();

  // Rule 1: Husband
  if (hasHeir(input, "husband")) {
    if (hasOffspring(input)) {
      result.set("husband", {
        share: ONE_FOURTH,
        explanation: "Husband gets 1/4 because the deceased has offspring (Rule 1b).",
      });
    } else {
      result.set("husband", {
        share: ONE_HALF,
        explanation:
          "Husband gets 1/2 because the deceased has no offspring (Rule 1a).",
      });
    }
  }

  // Rule 2: Wife (shared equally among all wives)
  if (hasHeir(input, "wife")) {
    if (hasOffspring(input)) {
      result.set("wife", {
        share: ONE_EIGHTH,
        explanation:
          "Wife gets 1/8 because the deceased has offspring (Rule 2b).",
      });
    } else {
      result.set("wife", {
        share: ONE_FOURTH,
        explanation:
          "Wife gets 1/4 because the deceased has no offspring (Rule 2a).",
      });
    }
  }

  // Rule 3: Daughter
  if (hasHeir(input, "daughter")) {
    if (hasHeir(input, "son")) {
      // Daughters become asaba with son (2:1 ratio) - no fard share
      // Don't add to fard result - handled by asaba
    } else {
      const count = heirCount(input, "daughter");
      if (count === 1) {
        result.set("daughter", {
          share: ONE_HALF,
          explanation:
            "Daughter gets 1/2 as the only daughter with no sons (Rule 3a).",
        });
      } else {
        result.set("daughter", {
          share: TWO_THIRDS,
          explanation: `Daughters share 2/3 equally (${count} daughters, no sons) (Rule 3b).`,
        });
      }
    }
  }

  // Rule 4: Granddaughter (son's daughter)
  if (hasHeir(input, "granddaughter")) {
    if (hasHeir(input, "son")) {
      // Blocked by son - gets nothing
      result.set("granddaughter", {
        share: ZERO,
        explanation: "Granddaughter is blocked by the presence of a son.",
      });
    } else if (hasHeir(input, "grandson")) {
      // Enters asaba with grandson (2:1 ratio) - no fard share
    } else if (heirCount(input, "daughter") >= 2) {
      // Blocked by 2+ daughters
      result.set("granddaughter", {
        share: ZERO,
        explanation:
          "Granddaughter is blocked because 2 or more daughters already take the 2/3 share.",
      });
    } else if (heirCount(input, "daughter") === 1) {
      // Gets 1/6 to complete 2/3
      result.set("granddaughter", {
        share: ONE_SIXTH,
        explanation:
          "Granddaughter gets 1/6 to complete the 2/3 share with the single daughter (Rule 4c).",
      });
    } else {
      // No daughters, no sons, no grandsons
      const count = heirCount(input, "granddaughter");
      if (count === 1) {
        result.set("granddaughter", {
          share: ONE_HALF,
          explanation:
            "Granddaughter gets 1/2 as the only granddaughter with no sons or daughters (Rule 4a).",
        });
      } else {
        result.set("granddaughter", {
          share: TWO_THIRDS,
          explanation: `Granddaughters share 2/3 equally (${count} granddaughters, no sons or daughters) (Rule 4b).`,
        });
      }
    }
  }

  // Rule 5: Father
  if (hasHeir(input, "father")) {
    if (hasOffspring(input)) {
      result.set("father", {
        share: ONE_SIXTH,
        explanation:
          "Father gets 1/6 prescribed share because the deceased has offspring (Rule 5a). May also receive residuary.",
      });
    }
    // If no offspring, father is purely asaba (no fard) - handled by asaba calculator
  }

  // Rule 6: Mother
  if (hasHeir(input, "mother")) {
    if (hasOffspring(input) || hasMultipleSiblings(input)) {
      result.set("mother", {
        share: ONE_SIXTH,
        explanation: hasOffspring(input)
          ? "Mother gets 1/6 because the deceased has offspring (Rule 6b)."
          : "Mother gets 1/6 because the deceased has multiple siblings (Rule 6b).",
      });
    } else {
      result.set("mother", {
        share: ONE_THIRD,
        explanation:
          "Mother gets 1/3 because the deceased has no offspring and fewer than 2 siblings (Rule 6a).",
      });
    }
  }

  // Rule 7: Paternal Grandfather
  if (hasHeir(input, "grandfather")) {
    if (hasHeir(input, "father")) {
      result.set("grandfather", {
        share: ZERO,
        explanation: "Grandfather is blocked by the presence of the father.",
      });
    } else if (hasOffspring(input)) {
      result.set("grandfather", {
        share: ONE_SIXTH,
        explanation:
          "Grandfather gets 1/6 because the deceased has offspring and no father (Rule 7a).",
      });
    }
    // If no father and no offspring: grandfather is asaba (or special grandfather-siblings case)
    // This is handled by the special cases / asaba calculator
  }

  // Rule 8: Paternal Grandmother
  if (hasHeir(input, "paternal_grandmother")) {
    if (hasHeir(input, "father")) {
      result.set("paternal_grandmother", {
        share: ZERO,
        explanation:
          "Paternal grandmother is blocked by the presence of the father.",
      });
    } else if (hasHeir(input, "mother")) {
      result.set("paternal_grandmother", {
        share: ZERO,
        explanation:
          "Paternal grandmother is blocked by the presence of the mother.",
      });
    } else if (hasHeir(input, "maternal_grandmother")) {
      // Both grandmothers share 1/6 (each gets 1/12)
      result.set("paternal_grandmother", {
        share: ONE_TWELFTH,
        explanation:
          "Paternal grandmother shares the 1/6 with maternal grandmother (each gets 1/12) (Rule 8b).",
      });
    } else {
      result.set("paternal_grandmother", {
        share: ONE_SIXTH,
        explanation:
          "Paternal grandmother gets 1/6 (no mother, no father, no maternal grandmother) (Rule 8a).",
      });
    }
  }

  // Rule 9: Maternal Grandmother
  if (hasHeir(input, "maternal_grandmother")) {
    if (hasHeir(input, "mother")) {
      result.set("maternal_grandmother", {
        share: ZERO,
        explanation:
          "Maternal grandmother is blocked by the presence of the mother.",
      });
    } else if (
      hasHeir(input, "paternal_grandmother") &&
      !hasHeir(input, "father")
    ) {
      // Both grandmothers share 1/6 (each gets 1/12)
      result.set("maternal_grandmother", {
        share: ONE_TWELFTH,
        explanation:
          "Maternal grandmother shares the 1/6 with paternal grandmother (each gets 1/12) (Rule 9b).",
      });
    } else {
      result.set("maternal_grandmother", {
        share: ONE_SIXTH,
        explanation:
          "Maternal grandmother gets 1/6 (no mother) (Rule 9a).",
      });
    }
  }

  // Rule 10: Full Sister
  if (hasHeir(input, "full_sister")) {
    if (hasOffspring(input)) {
      // Full sister becomes asaba with female offspring (Rule 30e: female offspring gets sisters out of 2/3 zone)
      // This is "asaba ma'a ghayriha" - residuary with others
      // Don't set fard - handled by asaba
    } else if (hasMalePaternalAncestor(input)) {
      // Blocked by father; grandfather is special case handled later
      if (hasHeir(input, "father")) {
        result.set("full_sister", {
          share: ZERO,
          explanation: "Full sister is blocked by the presence of the father.",
        });
      }
      // If grandfather (no father): handled by grandfather-siblings special case
    } else if (hasHeir(input, "full_brother")) {
      // Enters asaba with full brother (2:1) - no fard
    } else {
      const count = heirCount(input, "full_sister");
      if (count === 1) {
        result.set("full_sister", {
          share: ONE_HALF,
          explanation:
            "Full sister gets 1/2 as the only full sister with no offspring, father, or full brother (Rule 10a).",
        });
      } else {
        result.set("full_sister", {
          share: TWO_THIRDS,
          explanation: `Full sisters share 2/3 equally (${count} full sisters) (Rule 10b).`,
        });
      }
    }
  }

  // Rule 11: Paternal Sister
  if (hasHeir(input, "paternal_sister")) {
    if (hasOffspring(input)) {
      // May become asaba with female offspring
      if (hasHeir(input, "son") || hasHeir(input, "grandson")) {
        result.set("paternal_sister", {
          share: ZERO,
          explanation: "Paternal sister is blocked by male offspring.",
        });
      }
      // With only female offspring: becomes asaba (handled by asaba calc)
    } else if (hasHeir(input, "father")) {
      result.set("paternal_sister", {
        share: ZERO,
        explanation:
          "Paternal sister is blocked by the presence of the father.",
      });
    } else if (
      hasHeir(input, "full_brother") ||
      hasHeir(input, "paternal_brother")
    ) {
      if (hasHeir(input, "full_brother")) {
        // Blocked by full brother (Rule 13f)
        result.set("paternal_sister", {
          share: ZERO,
          explanation:
            "Paternal sister is blocked by the presence of a full brother.",
        });
      }
      // With paternal brother: enters asaba (2:1) - no fard
    } else if (heirCount(input, "full_sister") >= 2) {
      // Blocked: 2+ full sisters already fill the 2/3 zone
      result.set("paternal_sister", {
        share: ZERO,
        explanation:
          "Paternal sister is blocked because 2 or more full sisters already take the 2/3 share.",
      });
    } else if (heirCount(input, "full_sister") === 1) {
      // Gets 1/6 to complete 2/3
      result.set("paternal_sister", {
        share: ONE_SIXTH,
        explanation:
          "Paternal sister gets 1/6 to complete the 2/3 share with the single full sister (Rule 11c).",
      });
    } else if (hasHeir(input, "grandfather")) {
      // Grandfather-siblings special case - handled later
    } else {
      const count = heirCount(input, "paternal_sister");
      if (count === 1) {
        result.set("paternal_sister", {
          share: ONE_HALF,
          explanation:
            "Paternal sister gets 1/2 as the only paternal sister with no offspring, father, full brother, full sister, or paternal brother (Rule 11a).",
        });
      } else {
        result.set("paternal_sister", {
          share: TWO_THIRDS,
          explanation: `Paternal sisters share 2/3 equally (${count} paternal sisters) (Rule 11b).`,
        });
      }
    }
  }

  // Rule 12: Maternal Siblings
  // Note: ilmsummit Rule 12 says blocked by "male offspring" and "male paternal ancestors"
  for (const mSibling of ["maternal_brother", "maternal_sister"] as const) {
    if (hasHeir(input, mSibling)) {
      if (hasMaleOffspring(input)) {
        result.set(mSibling, {
          share: ZERO,
          explanation: `Maternal ${mSibling === "maternal_brother" ? "brother" : "sister"} is blocked by the presence of male offspring.`,
        });
      } else if (hasMalePaternalAncestor(input)) {
        result.set(mSibling, {
          share: ZERO,
          explanation: `Maternal ${mSibling === "maternal_brother" ? "brother" : "sister"} is blocked by the presence of a male paternal ancestor.`,
        });
      } else {
        // Maternal siblings share equally (no 2:1 gender ratio - Rule 33)
        const totalMaternal =
          heirCount(input, "maternal_brother") +
          heirCount(input, "maternal_sister");

        if (totalMaternal === 1) {
          result.set(mSibling, {
            share: ONE_SIXTH,
            explanation: `Maternal ${mSibling === "maternal_brother" ? "brother" : "sister"} gets 1/6 as the only maternal sibling (Rule 12a).`,
          });
        } else {
          // Multiple maternal siblings share 1/3
          result.set(mSibling, {
            share: ONE_THIRD,
            explanation: `Maternal siblings share 1/3 equally (${totalMaternal} total maternal siblings) (Rule 12b).`,
          });
        }
      }
    }
  }

  return result;
}
