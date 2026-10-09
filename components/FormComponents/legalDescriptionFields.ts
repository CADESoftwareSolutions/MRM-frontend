import { tractsConfig, TRACT_TYPE_OPTIONS } from "@/config/tractsConfig";

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
