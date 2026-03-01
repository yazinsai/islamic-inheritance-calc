# Islamic Inheritance Calculator - Specification

## Overview
A web application that calculates Islamic inheritance (faraid/mirath) shares with absolute correctness and maximum simplicity. The app dynamically adjusts its form to require only the minimum information needed, making it accessible to anyone.

## Core Principles
1. **Correctness first** - Every rule must be verified against scholarly sources
2. **Simplicity** - Minimum questions, maximum clarity
3. **Dynamic form** - Fields appear/disappear based on relevance
4. **Clear results** - Show fractions AND actual amounts, with plain English explanations

## Fiqh School
Primary implementation follows the **Hanafi** school (most widely followed), with the following key rules. The reference implementation from HU-BCS1 is used as a baseline but we verify independently.

---

## Heirs & Their Shares

### Always-Present Heirs (Never Fully Excluded)
These 5 heirs can never be completely excluded:
1. **Father** - 1/6 (with descendants) or residuary
2. **Mother** - 1/6 (with descendants or 2+ siblings) or 1/3
3. **Husband** - 1/2 (no descendants) or 1/4
4. **Wife** - 1/4 (no descendants) or 1/8
5. **Daughter** - 1/2 (alone) or 2/3 (2+) or residuary with son

### Complete Heir List (22 types)

#### Spouses
| Heir | Condition | Share |
|------|-----------|-------|
| Husband | No descendants of deceased | 1/2 |
| Husband | With descendants | 1/4 |
| Wife (1-4) | No descendants of deceased | 1/4 (shared) |
| Wife (1-4) | With descendants | 1/8 (shared) |

#### Direct Descendants
| Heir | Condition | Share |
|------|-----------|-------|
| Son | Always residuary | Residuary (2:1 with daughters) |
| Daughter (alone) | No son | 1/2 |
| Daughters (2+) | No son | 2/3 (shared equally) |
| Daughter(s) | With son | Residuary (son gets 2x daughter) |
| Son's son (paternal grandson) | No son | Residuary |
| Son's daughter (paternal granddaughter, alone) | No son, no 2+ daughters | 1/2 |
| Son's daughters (2+) | No son, no daughters | 2/3 (shared) |
| Son's daughter | With 1 daughter, no son | 1/6 |
| Son's daughter | With 2+ daughters, no son's son | Blocked |
| Son's daughter | With son's son | Residuary (2:1) |

#### Ascendants
| Heir | Condition | Share |
|------|-----------|-------|
| Father | With descendants | 1/6 + residuary |
| Father | No descendants | Residuary |
| Mother | With descendants OR 2+ siblings | 1/6 |
| Mother | No descendants, < 2 siblings | 1/3 |
| Mother | Umariyyah case (father + spouse only) | 1/3 of remainder |
| Paternal grandfather | Father absent, with descendants | 1/6 |
| Paternal grandfather | Father absent, no descendants | Residuary |
| Paternal grandmother | Father & mother absent | 1/6 |
| Maternal grandmother | Mother absent | 1/6 |
| Both grandmothers | Both qualifying | Share 1/6 equally |

#### Siblings
| Heir | Condition | Share |
|------|-----------|-------|
| Full brother | No descendants, no father/grandfather | Residuary |
| Full sister (alone) | No descendants, no father/grandfather, no full brother | 1/2 |
| Full sisters (2+) | No descendants, no father/grandfather, no full brother | 2/3 |
| Full sister(s) | With full brother | Residuary (2:1) |
| Paternal half-brother | No full brother, no descendants, no father | Residuary |
| Paternal half-sister (alone) | No full siblings, no descendants, no father | 1/2 |
| Paternal half-sisters (2+) | No full siblings, no descendants, no father | 2/3 |
| Paternal half-sister | With 1 full sister | 1/6 |
| Paternal half-sister | With 2+ full sisters | Blocked |
| Maternal half-sibling (alone) | No descendants, no father/grandfather | 1/6 |
| Maternal half-siblings (2+) | No descendants, no father/grandfather | 1/3 (shared equally) |

#### Extended (Residuary only)
| Heir | Condition | Share |
|------|-----------|-------|
| Full nephew (brother's son) | Residuary after higher ranks | Residuary |
| Paternal nephew | Residuary after higher ranks | Residuary |
| Full paternal uncle | Residuary after higher ranks | Residuary |
| Paternal paternal uncle | Residuary after higher ranks | Residuary |
| Full cousin (uncle's son) | Residuary after higher ranks | Residuary |
| Paternal cousin | Residuary after higher ranks | Residuary |

---

## Blocking Rules (Hajb)

### Complete Exclusion (Hajb Hirman)
| Blocked Heir | Blocked By |
|-------------|------------|
| Paternal grandfather | Father |
| Paternal grandmother | Father OR Mother |
| Maternal grandmother | Mother |
| Son's son | Son |
| Son's daughter | Son (but enters ta'seeb if son's son present) |
| Son's daughter | 2+ daughters (unless son's son present) |
| Full brother | Son, son's son, father |
| Full sister | Son, son's son, father |
| Paternal half-brother | Son, son's son, father, full brother |
| Paternal half-sister | Son, son's son, father, full brother, 2+ full sisters |
| Maternal half-sibling | Any descendant, father, paternal grandfather |
| Full nephew | Son, son's son, father, grandfather, full brother, paternal half-brother |
| Paternal nephew | Above + full nephew |
| Full paternal uncle | Above + paternal nephew |
| Paternal paternal uncle | Above + full paternal uncle |
| Full cousin | Above + paternal paternal uncle |
| Paternal cousin | Above + full cousin |

### Partial Exclusion (Share Reduction)
| Heir | Normal Share | Reduced To | When |
|------|-------------|-----------|------|
| Husband | 1/2 | 1/4 | Descendants exist |
| Wife | 1/4 | 1/8 | Descendants exist |
| Mother | 1/3 | 1/6 | Descendants OR 2+ siblings exist |
| Son's daughter | 1/2 | 1/6 | 1 daughter exists |

---

## Special Cases

### 1. Awl (Proportional Reduction)
When total prescribed shares > 1, all shares are proportionally reduced.
- New share = original_share / total_of_all_shares
- Only occurs with certain combinations of heirs

### 2. Radd (Return/Redistribution)
When total shares < 1 and no residuary heirs exist:
- Remainder distributed proportionally to fard heirs
- **Spouse excluded from radd** when other heirs exist
- If only spouse exists, spouse gets all (some scholars disagree)

### 3. Umariyyah Case
When only father + mother + spouse (no descendants, no siblings):
- **Father + Mother + Husband**: Husband 1/2, Mother 1/6, Father 1/3
- **Father + Mother + Wife**: Wife 1/4, Mother 1/4, Father 1/2
- (Mother gets 1/3 of remainder after spouse's share)

### 4. Mushtaraka (Participation) Case
When full brothers exist alongside maternal siblings and both qualify:
- Full brothers share in the maternal siblings' 1/3 portion
- All share equally (controversial - Maliki/Shafi'i view)
- **Hanafi view**: Full brothers do NOT share with maternal siblings
- We implement the Hanafi view (full brother gets residuary, not from maternal share)

### 5. Grandfather with Siblings
Complex case when paternal grandfather exists with siblings (no father):
- **Hanafi view**: Grandfather blocks all siblings (simple rule)
- We implement Hanafi view

---

## Residuary (Asaba) Hierarchy
Strict order - only highest available rank inherits:

1. Son (+ daughter at 2:1)
2. Son's son / Son's daughter (2:1)
3. Father
4. Paternal grandfather
5. Full brother (+ full sister at 2:1)
6. Paternal half-brother (+ paternal half-sister at 2:1)
7. Full nephew (brother's son)
8. Paternal nephew
9. Full paternal uncle
10. Paternal paternal uncle
11. Full cousin
12. Paternal cousin

---

## Dynamic Form Logic

### Phase 1: Basic Info
- Gender of deceased (male/female) - determines spouse options
- Marital status → spouse details
- Estate amount (after debts, funeral expenses, wasiyyah)

### Phase 2: Direct Descendants
- Sons (count)
- Daughters (count)
- If no sons/daughters: Son's sons, Son's daughters

### Phase 3: Parents
- Father alive? (yes/no)
- Mother alive? (yes/no)
- If no father: Paternal grandfather alive?
- If no mother AND no father: Grandmothers

### Phase 4: Siblings (only if no sons AND following Hanafi: no father/grandfather)
- Full brothers (count)
- Full sisters (count)
- Paternal half-brothers (count)
- Paternal half-sisters (count)
- Maternal half-siblings (count)

### Phase 5: Extended Family (only if NO closer residuary)
- Only shown when no sons, grandsons, father, grandfather, or brothers exist
- Nephews, uncles, cousins

### Dynamic Exclusion Rules
- If son exists → hide grandsons/granddaughters, siblings, extended family
- If father exists → hide grandfather, grandmothers, siblings, extended family
- If any residuary heir exists → hide lower-ranked residuaries
- As user fills in heirs, dynamically show/hide remaining questions

---

## UI/UX Requirements

### Input
- Clean, step-by-step form (not all fields at once)
- Progressive disclosure - only show relevant fields
- Simple counters for multiple heirs (0, 1, 2, 3+)
- Estate amount input with currency
- Clear labels in English (with Arabic terms as optional reference)

### Output
- Table showing each heir, their Islamic share (fraction), and actual amount
- Total must equal 100% (show verification)
- Plain English explanation of WHY each heir gets their share
- If awl/radd applied, explain it simply
- Show which heirs were blocked and why

### Design
- Mobile-first responsive
- Clean, minimal, calming design
- No clutter - just the essentials
- Accessible (WCAG AA)

---

## Tech Stack
- **Next.js** (App Router) - for the web app
- **TypeScript** - for type safety in calculations
- **Tailwind CSS + shadcn/ui** - for the UI
- **fraction.js** - for exact rational arithmetic (no floating point)
- No database needed - pure client-side calculation

---

## Verification Strategy
1. **Unit tests** for every heir combination using Jest/Vitest
2. **Test cases from reference implementation** (102 cases from HU-BCS1)
3. **Test cases from ilmsummit.org** (when available)
4. **Manual verification** against known scholarly examples
5. **Browser testing** with dev-browser for UI flows

## Completion Conditions
- All 102+ reference test cases pass
- UI works on mobile and desktop
- Form dynamically hides irrelevant fields
- Results show fractions and amounts
- Results include plain English explanations
- Deployed and accessible

---

## Pre-Deduction Note
The calculator assumes the estate amount entered is AFTER:
1. Funeral/burial expenses
2. Debt repayment
3. Wasiyyah (will) - up to 1/3 of estate

We will add a note explaining this, and optionally a pre-calculator to help with these deductions.
