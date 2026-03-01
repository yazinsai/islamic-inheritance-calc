import Fraction from "fraction.js";
import {
  HeirInput,
  HeirType,
  ExplanationTemplate,
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
  explanation: ExplanationTemplate;
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
        explanation: { key: "explain.husband.withOffspring" },
      });
    } else {
      result.set("husband", {
        share: ONE_HALF,
        explanation: { key: "explain.husband.noOffspring" },
      });
    }
  }

  // Rule 2: Wife (shared equally among all wives)
  if (hasHeir(input, "wife")) {
    if (hasOffspring(input)) {
      result.set("wife", {
        share: ONE_EIGHTH,
        explanation: { key: "explain.wife.withOffspring" },
      });
    } else {
      result.set("wife", {
        share: ONE_FOURTH,
        explanation: { key: "explain.wife.noOffspring" },
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
          explanation: { key: "explain.daughter.half" },
        });
      } else {
        result.set("daughter", {
          share: TWO_THIRDS,
          explanation: { key: "explain.daughter.twoThirds", vars: { count } },
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
        explanation: { key: "explain.granddaughter.blockedBySon" },
      });
    } else if (hasHeir(input, "grandson")) {
      // Enters asaba with grandson (2:1 ratio) - no fard share
    } else if (heirCount(input, "daughter") >= 2) {
      // Blocked by 2+ daughters
      result.set("granddaughter", {
        share: ZERO,
        explanation: { key: "explain.granddaughter.blockedByDaughters" },
      });
    } else if (heirCount(input, "daughter") === 1) {
      // Gets 1/6 to complete 2/3
      result.set("granddaughter", {
        share: ONE_SIXTH,
        explanation: { key: "explain.granddaughter.sixth" },
      });
    } else {
      // No daughters, no sons, no grandsons
      const count = heirCount(input, "granddaughter");
      if (count === 1) {
        result.set("granddaughter", {
          share: ONE_HALF,
          explanation: { key: "explain.granddaughter.half" },
        });
      } else {
        result.set("granddaughter", {
          share: TWO_THIRDS,
          explanation: { key: "explain.granddaughter.twoThirds", vars: { count } },
        });
      }
    }
  }

  // Rule 5: Father
  if (hasHeir(input, "father")) {
    if (hasOffspring(input)) {
      result.set("father", {
        share: ONE_SIXTH,
        explanation: { key: "explain.father.withOffspring" },
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
          ? { key: "explain.mother.withOffspring" }
          : { key: "explain.mother.multipleSiblings" },
      });
    } else {
      result.set("mother", {
        share: ONE_THIRD,
        explanation: { key: "explain.mother.third" },
      });
    }
  }

  // Rule 7: Paternal Grandfather
  if (hasHeir(input, "grandfather")) {
    if (hasHeir(input, "father")) {
      result.set("grandfather", {
        share: ZERO,
        explanation: { key: "explain.grandfather.blockedByFather" },
      });
    } else if (hasOffspring(input)) {
      result.set("grandfather", {
        share: ONE_SIXTH,
        explanation: { key: "explain.grandfather.withOffspring" },
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
        explanation: { key: "explain.paternalGrandmother.blockedByFather" },
      });
    } else if (hasHeir(input, "mother")) {
      result.set("paternal_grandmother", {
        share: ZERO,
        explanation: { key: "explain.paternalGrandmother.blockedByMother" },
      });
    } else if (hasHeir(input, "maternal_grandmother")) {
      // Both grandmothers share 1/6 (each gets 1/12)
      result.set("paternal_grandmother", {
        share: ONE_TWELFTH,
        explanation: { key: "explain.paternalGrandmother.shared" },
      });
    } else {
      result.set("paternal_grandmother", {
        share: ONE_SIXTH,
        explanation: { key: "explain.paternalGrandmother.sixth" },
      });
    }
  }

  // Rule 9: Maternal Grandmother
  if (hasHeir(input, "maternal_grandmother")) {
    if (hasHeir(input, "mother")) {
      result.set("maternal_grandmother", {
        share: ZERO,
        explanation: { key: "explain.maternalGrandmother.blockedByMother" },
      });
    } else if (
      hasHeir(input, "paternal_grandmother") &&
      !hasHeir(input, "father")
    ) {
      // Both grandmothers share 1/6 (each gets 1/12)
      result.set("maternal_grandmother", {
        share: ONE_TWELFTH,
        explanation: { key: "explain.maternalGrandmother.shared" },
      });
    } else {
      result.set("maternal_grandmother", {
        share: ONE_SIXTH,
        explanation: { key: "explain.maternalGrandmother.sixth" },
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
          explanation: { key: "explain.fullSister.blockedByFather" },
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
          explanation: { key: "explain.fullSister.half" },
        });
      } else {
        result.set("full_sister", {
          share: TWO_THIRDS,
          explanation: { key: "explain.fullSister.twoThirds", vars: { count } },
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
          explanation: { key: "explain.paternalSister.blockedByMaleOffspring" },
        });
      }
      // With only female offspring: becomes asaba (handled by asaba calc)
    } else if (hasHeir(input, "father")) {
      result.set("paternal_sister", {
        share: ZERO,
        explanation: { key: "explain.paternalSister.blockedByFather" },
      });
    } else if (
      hasHeir(input, "full_brother") ||
      hasHeir(input, "paternal_brother")
    ) {
      if (hasHeir(input, "full_brother")) {
        // Blocked by full brother (Rule 13f)
        result.set("paternal_sister", {
          share: ZERO,
          explanation: { key: "explain.paternalSister.blockedByFullBrother" },
        });
      }
      // With paternal brother: enters asaba (2:1) - no fard
    } else if (heirCount(input, "full_sister") >= 2) {
      // Blocked: 2+ full sisters already fill the 2/3 zone
      result.set("paternal_sister", {
        share: ZERO,
        explanation: { key: "explain.paternalSister.blockedByFullSisters" },
      });
    } else if (heirCount(input, "full_sister") === 1) {
      // Gets 1/6 to complete 2/3
      result.set("paternal_sister", {
        share: ONE_SIXTH,
        explanation: { key: "explain.paternalSister.sixth" },
      });
    } else if (hasHeir(input, "grandfather")) {
      // Grandfather-siblings special case - handled later
    } else {
      const count = heirCount(input, "paternal_sister");
      if (count === 1) {
        result.set("paternal_sister", {
          share: ONE_HALF,
          explanation: { key: "explain.paternalSister.half" },
        });
      } else {
        result.set("paternal_sister", {
          share: TWO_THIRDS,
          explanation: { key: "explain.paternalSister.twoThirds", vars: { count } },
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
          explanation: {
            key: mSibling === "maternal_brother"
              ? "explain.maternalBrother.blockedByOffspring"
              : "explain.maternalSister.blockedByOffspring",
          },
        });
      } else if (hasMalePaternalAncestor(input)) {
        result.set(mSibling, {
          share: ZERO,
          explanation: {
            key: mSibling === "maternal_brother"
              ? "explain.maternalBrother.blockedByAncestor"
              : "explain.maternalSister.blockedByAncestor",
          },
        });
      } else {
        // Maternal siblings share equally (no 2:1 gender ratio - Rule 33)
        const totalMaternal =
          heirCount(input, "maternal_brother") +
          heirCount(input, "maternal_sister");

        if (totalMaternal === 1) {
          result.set(mSibling, {
            share: ONE_SIXTH,
            explanation: {
              key: mSibling === "maternal_brother"
                ? "explain.maternalBrother.sixth"
                : "explain.maternalSister.sixth",
            },
          });
        } else {
          // Multiple maternal siblings share 1/3
          result.set(mSibling, {
            share: ONE_THIRD,
            explanation: { key: "explain.maternalSibling.third", vars: { count: totalMaternal } },
          });
        }
      }
    }
  }

  return result;
}
