import { tractsConfig, TRACT_TYPE_OPTIONS } from "@/config/tractsConfig";
import type { TractOption } from "@/hooks/useTracts";

// Shared by TractPickerField's linked-entry cards and LegalDescriptionForm's duplicate-match
// popup — both render "this Tract's legal description, read-only" and need the same field set
// and type-to-fields filtering, just for different tracts. Pulled out to its own module (rather
// than one component importing the other) since TractPickerField renders LegalDescriptionForm
// and a reverse import would be circular.
export const LEGAL_FIELDS = tractsConfig.fields.filter(
  (f) =>
    f.tab === "legal" &&
    f.section === "legal-description" &&
    f.id !== "tractType" &&
    f.id !== "stateCode" &&
    f.id !== "countyName",
);

export const TRACT_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TRACT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
);

export const fieldAppliesToType = (dependsOnValue: any, tractType: string): boolean => {
  const targets = Array.isArray(dependsOnValue) ? dependsOnValue : [dependsOnValue];
  return targets.includes(tractType);
};

export const visibleLegalFieldsFor = (tractType: string | null | undefined) =>
  LEGAL_FIELDS.filter((f) => fieldAppliesToType(f.dependsOnValue, tractType || ""));

// Seeded T&P tracts carry their township only in surveyTownship, which no form edits.
export const legalFieldValue = (tract: TractOption, fieldId: string): string | null | undefined =>
  fieldId === "township" ? tract.township || tract.surveyTownship : (tract as any)[fieldId];

const KEY_LEGAL_FIELDS = [
  { id: "blockNo", label: "Block" },
  { id: "section", label: "Section" },
  { id: "survey", label: "Survey" },
  { id: "township", label: "Township" },
  { id: "lotNo", label: "Lot" },
];

// A linked legal description card's header values, collapsed or not. Filtered by the same per-type
// field list TractLegalSummary uses, so the header never shows a value the expanded card doesn't
// (e.g. a Lot still stored from before the tract's type was changed to Metes and Bounds).
export const keyLegalValues = (tract: TractOption) => {
  const visibleFields = visibleLegalFieldsFor(tract.tractType);
  return KEY_LEGAL_FIELDS.flatMap(({ id, label }) => {
    const value = legalFieldValue(tract, id);
    return value && visibleFields.some((f) => f.id === id) ? [{ id, label, value }] : [];
  });
};
