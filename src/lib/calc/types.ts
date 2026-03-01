import Fraction from "fraction.js";

/**
 * All possible heir types in Islamic inheritance.
 * Names match ilmsummit.org convention.
 */
export type HeirType =
  // Spouses
  | "husband"
  | "wife"
  // Direct descendants
  | "son"
  | "daughter"
  | "grandson" // son's son
  | "granddaughter" // son's daughter
  // Ascendants
  | "father"
  | "mother"
  | "grandfather" // paternal grandfather
  | "paternal_grandmother"
  | "maternal_grandmother"
  // Full siblings
  | "full_brother"
  | "full_sister"
  // Paternal half-siblings
  | "paternal_brother"
  | "paternal_sister"
  // Maternal half-siblings
  | "maternal_brother"
  | "maternal_sister"
  // Extended family (residuary only)
  | "full_nephew" // full brother's son
  | "paternal_nephew" // paternal brother's son
  | "full_uncle" // father's full brother
  | "paternal_uncle" // father's paternal brother
  | "full_cousin" // father's full brother's son
  | "paternal_cousin" // father's paternal brother's son
  | "paternal_cousins_grandson"; // father's paternal brother's son's son

/**
 * Input to the calculator: which heirs exist and how many.
 */
export type HeirInput = Partial<Record<HeirType, number>>;

/**
 * Share type classification.
 */
export type ShareType = "fard" | "asaba" | "fard+asaba";

/**
 * A translatable explanation template.
 * The key maps to a translation string; vars are substituted into it.
 * prefix chains explanations (e.g., original explanation + awl/radd suffix).
 */
export interface ExplanationTemplate {
  key: string;
  vars?: Record<string, string | number>;
  prefix?: ExplanationTemplate;
}

/**
 * A single heir's calculated share.
 */
export interface HeirShare {
  heir: HeirType;
  count: number;
  shareType: ShareType;
  /** Total share for this category of heir (e.g., 2/3 for "all daughters") */
  totalShare: Fraction;
  /** Share per individual heir */
  individualShare: Fraction;
  /** Translatable explanation of why they receive this share */
  explanation: ExplanationTemplate;
}

/**
 * Result of the calculation.
 */
export interface CalculationResult {
  /** All heir shares (including those with 0 share for blocked heirs) */
  shares: HeirShare[];
  /** Whether awl was applied */
  awlApplied: boolean;
  /** Whether radd was applied */
  raddApplied: boolean;
  /** Whether the Umariyyah case was applied */
  umariyyahApplied: boolean;
  /** Whether the Mushtaraka case was applied */
  mushtarakaApplied: boolean;
  /** Whether the grandfather-siblings special case was applied */
  grandfatherSiblingsApplied: boolean;
  /** Calculation steps as translatable templates */
  steps: ExplanationTemplate[];
}

/**
 * Maps ilmsummit heir names to our internal types.
 */
export const ILMSUMMIT_HEIR_MAP: Record<string, HeirType> = {
  Husband: "husband",
  Wife: "wife",
  Son: "son",
  Daughter: "daughter",
  GrandSon: "grandson",
  GrandDaughter: "granddaughter",
  Father: "father",
  Mother: "mother",
  GrandFather: "grandfather",
  PaternalGrandMother: "paternal_grandmother",
  MaternalGrandMother: "maternal_grandmother",
  FullBrother: "full_brother",
  FullSister: "full_sister",
  PaternalBrother: "paternal_brother",
  PaternalSister: "paternal_sister",
  MaternalBrother: "maternal_brother",
  MaternalSister: "maternal_sister",
  FullNephew: "full_nephew",
  PaternalNephew: "paternal_nephew",
  FullUncle: "full_uncle",
  PaternalUncle: "paternal_uncle",
  FullCousin: "full_cousin",
  PaternalCousin: "paternal_cousin",
  PaternalCousinsGrandSon: "paternal_cousins_grandson",
};

/**
 * Display names for heirs (English).
 */
export const HEIR_DISPLAY_NAMES: Record<HeirType, string> = {
  husband: "Husband",
  wife: "Wife",
  son: "Son",
  daughter: "Daughter",
  grandson: "Grandson (son's son)",
  granddaughter: "Granddaughter (son's daughter)",
  father: "Father",
  mother: "Mother",
  grandfather: "Grandfather (paternal)",
  paternal_grandmother: "Grandmother (paternal)",
  maternal_grandmother: "Grandmother (maternal)",
  full_brother: "Full Brother",
  full_sister: "Full Sister",
  paternal_brother: "Paternal Half-Brother",
  paternal_sister: "Paternal Half-Sister",
  maternal_brother: "Maternal Half-Brother",
  maternal_sister: "Maternal Half-Sister",
  full_nephew: "Full Nephew (brother's son)",
  paternal_nephew: "Paternal Nephew",
  full_uncle: "Full Uncle (paternal)",
  paternal_uncle: "Paternal Uncle",
  full_cousin: "Full Cousin",
  paternal_cousin: "Paternal Cousin",
  paternal_cousins_grandson: "Paternal Cousin's Grandson",
};

/**
 * Helper to check if a specific heir exists in input.
 */
export function hasHeir(input: HeirInput, heir: HeirType): boolean {
  return (input[heir] ?? 0) > 0;
}

/**
 * Get count of a specific heir.
 */
export function heirCount(input: HeirInput, heir: HeirType): number {
  return input[heir] ?? 0;
}

/**
 * Check if the deceased has any offspring (children or grandchildren).
 */
export function hasOffspring(input: HeirInput): boolean {
  return (
    hasHeir(input, "son") ||
    hasHeir(input, "daughter") ||
    hasHeir(input, "grandson") ||
    hasHeir(input, "granddaughter")
  );
}

/**
 * Check if the deceased has any male offspring.
 */
export function hasMaleOffspring(input: HeirInput): boolean {
  return hasHeir(input, "son") || hasHeir(input, "grandson");
}

/**
 * Check if the deceased has a male paternal ancestor (father or grandfather).
 */
export function hasMalePaternalAncestor(input: HeirInput): boolean {
  return hasHeir(input, "father") || hasHeir(input, "grandfather");
}

/**
 * Check if the deceased has multiple siblings (2 or more of any type).
 */
export function hasMultipleSiblings(input: HeirInput): boolean {
  const totalSiblings =
    heirCount(input, "full_brother") +
    heirCount(input, "full_sister") +
    heirCount(input, "paternal_brother") +
    heirCount(input, "paternal_sister") +
    heirCount(input, "maternal_brother") +
    heirCount(input, "maternal_sister");
  return totalSiblings >= 2;
}
