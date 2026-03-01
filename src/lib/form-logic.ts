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
  titleKey: string;
  subtitleKey?: string;
  fields: FormField[];
  visible: boolean;
}

export interface FormField {
  heir: HeirType;
  labelKey: string;
  max: number;
  visible: boolean;
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
      titleKey: "section.spouse",
      fields: [
        {
          heir: deceasedGender === "male" ? "wife" : "husband",
          labelKey: deceasedGender === "male" ? "form.wife" : "form.husband",
          max: deceasedGender === "male" ? 4 : 1,
          visible: true,
        },
      ],
      visible: true,
    },

    // Section 2: Children
    {
      id: "children",
      titleKey: "section.children",
      fields: [
        { heir: "son", labelKey: "form.sons", max: 20, visible: true },
        { heir: "daughter", labelKey: "form.daughters", max: 20, visible: true },
      ],
      visible: true,
    },

    // Section 3: Grandchildren (only shown if no sons)
    {
      id: "grandchildren",
      titleKey: "section.grandchildren",
      subtitleKey: "section.grandchildren.hint",
      fields: [
        { heir: "grandson", labelKey: "form.grandsons", max: 20, visible: !hasSon },
        {
          heir: "granddaughter",
          labelKey: "form.granddaughters",
          max: 20,
          visible: !hasSon,
        },
      ],
      visible: !hasSon,
    },

    // Section 4: Parents
    {
      id: "parents",
      titleKey: "section.parents",
      fields: [
        { heir: "father", labelKey: "form.father", max: 1, visible: true },
        { heir: "mother", labelKey: "form.mother", max: 1, visible: true },
      ],
      visible: true,
    },

    // Section 5: Grandparents
    {
      id: "grandparents",
      titleKey: "section.grandparents",
      fields: [
        {
          heir: "grandfather",
          labelKey: "form.paternalGrandfather",
          max: 1,
          visible: !hasFather,
        },
        {
          heir: "paternal_grandmother",
          labelKey: "form.paternalGrandmother",
          max: 1,
          visible: !hasFather && !hasMother,
        },
        {
          heir: "maternal_grandmother",
          labelKey: "form.maternalGrandmother",
          max: 1,
          visible: !hasMother,
        },
      ],
      visible: !hasFather || !hasMother,
    },

    // Section 6: Full Siblings (only if no sons/grandsons, and no father)
    {
      id: "full_siblings",
      titleKey: "section.fullSiblings",
      subtitleKey: "section.fullSiblings.hint",
      fields: [
        {
          heir: "full_brother",
          labelKey: "form.fullBrothers",
          max: 20,
          visible: true,
        },
        {
          heir: "full_sister",
          labelKey: "form.fullSisters",
          max: 20,
          visible: true,
        },
      ],
      visible: !hasMaleOffspring && !hasFather,
    },

    // Section 7: Paternal Half-Siblings
    {
      id: "paternal_siblings",
      titleKey: "section.paternalHalfSiblings",
      subtitleKey: "section.paternalHalfSiblings.hint",
      fields: [
        {
          heir: "paternal_brother",
          labelKey: "form.paternalHalfBrothers",
          max: 20,
          visible: true,
        },
        {
          heir: "paternal_sister",
          labelKey: "form.paternalHalfSisters",
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
      titleKey: "section.maternalHalfSiblings",
      subtitleKey: "section.maternalHalfSiblings.hint",
      fields: [
        {
          heir: "maternal_brother",
          labelKey: "form.maternalHalfBrothers",
          max: 20,
          visible: true,
        },
        {
          heir: "maternal_sister",
          labelKey: "form.maternalHalfSisters",
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
      titleKey: "section.extendedFamily",
      subtitleKey: "section.extendedFamily.hint",
      fields: [
        {
          heir: "full_nephew",
          labelKey: "form.fullNephew",
          max: 10,
          visible: !hasCloseResiduary,
        },
        {
          heir: "paternal_nephew",
          labelKey: "form.paternalNephew",
          max: 10,
          visible: !hasCloseResiduary && !hasHeir(input, "full_nephew"),
        },
        {
          heir: "full_uncle",
          labelKey: "form.paternalUncleFull",
          max: 10,
          visible:
            !hasCloseResiduary &&
            !hasHeir(input, "full_nephew") &&
            !hasHeir(input, "paternal_nephew"),
        },
        {
          heir: "paternal_uncle",
          labelKey: "form.paternalUncleHalf",
          max: 10,
          visible:
            !hasCloseResiduary &&
            !hasHeir(input, "full_nephew") &&
            !hasHeir(input, "paternal_nephew") &&
            !hasHeir(input, "full_uncle"),
        },
        {
          heir: "full_cousin",
          labelKey: "form.fullCousin",
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
          labelKey: "form.paternalCousin",
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
