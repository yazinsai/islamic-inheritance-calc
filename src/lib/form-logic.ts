import { HeirInput, HeirType, hasHeir } from "./calc/types";

/**
 * Defines which heir fields should be visible based on current input state.
 * The goal is to require the ABSOLUTE MINIMUM information.
 *
 * Sections appear progressively:
 * 1. Spouse (always)
 * 2. Children (always)
 * 3. Grandchildren (only if no sons)
 * 4. Parents (always)
 * 5. Grandparents (only if relevant parent is missing)
 * 6. Full siblings (only if no sons/grandsons and no father)
 * 7. Paternal half-siblings (only if conditions met)
 * 8. Maternal half-siblings (only if no male offspring and no father/grandfather)
 * 9. Extended family (only if no closer residuary exists)
 */

export interface FormSection {
  id: string;
  title: string;
  subtitle?: string;
  fields: FormField[];
  visible: boolean;
}

export interface FormField {
  heir: HeirType;
  label: string;
  max: number;
  visible: boolean;
  hint?: string;
}

export function getFormSections(
  input: HeirInput,
  deceasedGender: "male" | "female",
): FormSection[] {
  const hasSon = hasHeir(input, "son");
  const hasDaughter = hasHeir(input, "daughter");
  const hasGrandson = hasHeir(input, "grandson");
  const hasGranddaughter = hasHeir(input, "granddaughter");
  const hasFather = hasHeir(input, "father");
  const hasMother = hasHeir(input, "mother");
  const hasGrandfather = hasHeir(input, "grandfather");
  const hasFullBrother = hasHeir(input, "full_brother");
  const hasFullSister = hasHeir(input, "full_sister");
  const hasPaternalBrother = hasHeir(input, "paternal_brother");

  const hasAnyOffspring = hasSon || hasDaughter || hasGrandson || hasGranddaughter;
  const hasMaleOffspring = hasSon || hasGrandson;

  // Determine if there's any closer residuary that blocks extended family
  const hasCloseResiduary =
    hasSon ||
    hasGrandson ||
    hasFather ||
    hasGrandfather ||
    hasFullBrother ||
    hasPaternalBrother;

  return [
    // Section 1: Spouse
    {
      id: "spouse",
      title: "Spouse",
      fields: [
        {
          heir: deceasedGender === "male" ? "wife" : "husband",
          label: deceasedGender === "male" ? "Wife" : "Husband",
          max: deceasedGender === "male" ? 4 : 1,
          visible: true,
        },
      ],
      visible: true,
    },

    // Section 2: Children
    {
      id: "children",
      title: "Children",
      fields: [
        { heir: "son", label: "Sons", max: 20, visible: true },
        { heir: "daughter", label: "Daughters", max: 20, visible: true },
      ],
      visible: true,
    },

    // Section 3: Grandchildren (only shown if no sons)
    {
      id: "grandchildren",
      title: "Grandchildren",
      subtitle: "Through sons only",
      fields: [
        { heir: "grandson", label: "Grandsons", max: 20, visible: !hasSon },
        {
          heir: "granddaughter",
          label: "Granddaughters",
          max: 20,
          visible: !hasSon,
        },
      ],
      visible: !hasSon,
    },

    // Section 4: Parents
    {
      id: "parents",
      title: "Parents",
      fields: [
        { heir: "father", label: "Father", max: 1, visible: true },
        { heir: "mother", label: "Mother", max: 1, visible: true },
      ],
      visible: true,
    },

    // Section 5: Grandparents
    {
      id: "grandparents",
      title: "Grandparents",
      fields: [
        {
          heir: "grandfather",
          label: "Paternal Grandfather",
          max: 1,
          visible: !hasFather,
        },
        {
          heir: "paternal_grandmother",
          label: "Paternal Grandmother",
          max: 1,
          visible: !hasFather && !hasMother,
        },
        {
          heir: "maternal_grandmother",
          label: "Maternal Grandmother",
          max: 1,
          visible: !hasMother,
        },
      ],
      visible: !hasFather || !hasMother,
    },

    // Section 6: Full Siblings (only if no sons/grandsons, and no father)
    {
      id: "full_siblings",
      title: "Full Siblings",
      subtitle: "Same father and mother",
      fields: [
        {
          heir: "full_brother",
          label: "Full Brothers",
          max: 20,
          visible: true,
        },
        {
          heir: "full_sister",
          label: "Full Sisters",
          max: 20,
          visible: true,
        },
      ],
      visible: !hasMaleOffspring && !hasFather,
    },

    // Section 7: Paternal Half-Siblings
    {
      id: "paternal_siblings",
      title: "Paternal Half-Siblings",
      subtitle: "Same father, different mother",
      fields: [
        {
          heir: "paternal_brother",
          label: "Paternal Half-Brothers",
          max: 20,
          visible: true,
        },
        {
          heir: "paternal_sister",
          label: "Paternal Half-Sisters",
          max: 20,
          visible: true,
        },
      ],
      visible:
        !hasMaleOffspring && !hasFather && !hasFullBrother,
    },

    // Section 8: Maternal Half-Siblings
    {
      id: "maternal_siblings",
      title: "Maternal Half-Siblings",
      subtitle: "Same mother, different father",
      fields: [
        {
          heir: "maternal_brother",
          label: "Maternal Half-Brothers",
          max: 20,
          visible: true,
        },
        {
          heir: "maternal_sister",
          label: "Maternal Half-Sisters",
          max: 20,
          visible: true,
        },
      ],
      visible:
        !hasMaleOffspring &&
        !hasFather &&
        !hasGrandfather,
    },

    // Section 9: Extended Family (nephews, uncles, cousins)
    {
      id: "extended",
      title: "Extended Family",
      subtitle: "Only relevant if no closer heirs exist",
      fields: [
        {
          heir: "full_nephew",
          label: "Full Nephew (brother's son)",
          max: 10,
          visible: !hasCloseResiduary,
        },
        {
          heir: "paternal_nephew",
          label: "Paternal Nephew",
          max: 10,
          visible: !hasCloseResiduary && !hasHeir(input, "full_nephew"),
        },
        {
          heir: "full_uncle",
          label: "Paternal Uncle (full)",
          max: 10,
          visible:
            !hasCloseResiduary &&
            !hasHeir(input, "full_nephew") &&
            !hasHeir(input, "paternal_nephew"),
        },
        {
          heir: "paternal_uncle",
          label: "Paternal Uncle (half)",
          max: 10,
          visible:
            !hasCloseResiduary &&
            !hasHeir(input, "full_nephew") &&
            !hasHeir(input, "paternal_nephew") &&
            !hasHeir(input, "full_uncle"),
        },
        {
          heir: "full_cousin",
          label: "Full Cousin (uncle's son)",
          max: 10,
          visible:
            !hasCloseResiduary &&
            !hasHeir(input, "full_nephew") &&
            !hasHeir(input, "paternal_nephew") &&
            !hasHeir(input, "full_uncle") &&
            !hasHeir(input, "paternal_uncle"),
        },
        {
          heir: "paternal_cousin",
          label: "Paternal Cousin",
          max: 10,
          visible:
            !hasCloseResiduary &&
            !hasHeir(input, "full_nephew") &&
            !hasHeir(input, "paternal_nephew") &&
            !hasHeir(input, "full_uncle") &&
            !hasHeir(input, "paternal_uncle") &&
            !hasHeir(input, "full_cousin"),
        },
      ],
      visible: !hasCloseResiduary,
    },
  ];
}
