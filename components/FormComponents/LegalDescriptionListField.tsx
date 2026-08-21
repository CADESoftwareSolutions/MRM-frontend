import { useAtom } from "jotai";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountyCombobox } from "./CountyCombobox";
import { STATES } from "@/config/directoryConfig";
import { tractsConfig, TRACT_TYPE_OPTIONS } from "@/config/tractsConfig";
import { themeAtom } from "@/atoms/NavigationAtom";
import type { StateCountyReference } from "@/hooks/useStateCountyReference";
import { Z_INDEX } from "@/lib/zIndex";

// Plain data owned by the Lease/Deed/Well — not a Tract (that's a separate, reusable,
// cross-referenceable entity managed on its own Tracts screen). Saved wholesale with the parent
// record, same as Recordation entries, so there's no id to resolve/reuse on save.
export interface LegalDescriptionEntry {
  id: string;
  sortOrder: number | null;
  grossAcres: number | null;
  netAcres: number | null;
  fields: Record<string, any>;
}

interface LegalDescriptionListFieldProps {
  value: LegalDescriptionEntry[];
  onChange: (entries: LegalDescriptionEntry[]) => void;
  stateCountyReference: StateCountyReference[];
}

export const newLegalDescriptionEntry = (): LegalDescriptionEntry => ({
  id: `legal-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  sortOrder: null,
  grossAcres: null,
  netAcres: null,
  fields: { tractType: "", stateCode: "", countyName: "" },
});

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";
const labelCls = "block text-xs font-medium text-purple-200 mb-1";

// Same fields + dependsOnValue rules as tractsConfig.ts's "legal" tab — read from there instead
// of duplicating the type-to-fields mapping a second time, so a change to what a legal
// description type shows only ever needs to happen in one place.
const LEGAL_FIELDS = tractsConfig.fields.filter(
  (f) => f.tab === "legal" && f.section === "legal-description",
);

const fieldAppliesToType = (dependsOnValue: any, tractType: string): boolean => {
  const targets = Array.isArray(dependsOnValue) ? dependsOnValue : [dependsOnValue];
  return targets.includes(tractType);
};

const numberOrNull = (raw: string): number | null => (raw === "" ? null : Number(raw));

export const LegalDescriptionListField = ({
  value,
  onChange,
  stateCountyReference,
}: LegalDescriptionListFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  const updateField = (id: string, key: string, val: any) => {
    onChange(value.map((e) => (e.id === id ? { ...e, fields: { ...e.fields, [key]: val } } : e)));
  };

  const updateEntry = (id: string, patch: Partial<LegalDescriptionEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

  const countiesForState = (state: string) =>
    stateCountyReference.find((s) => s.code === state)?.counties ?? [];

  return (
    <div className="space-y-4">
      {value.map((entry, index) => {
        const tractType = entry.fields.tractType || "";
        const visibleLegalFields = LEGAL_FIELDS.filter((f) =>
          fieldAppliesToType(f.dependsOnValue, tractType),
        );

        return (
          <div key={entry.id} className="border border-purple-300/20 rounded-xl p-4 bg-white/5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
                Legal Description #{index + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                className="p-1.5 rounded transition-colors cursor-pointer text-red-400/60 hover:text-red-300 hover:bg-red-500/20"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className={labelCls}>State</label>
                <Select
                  value={entry.fields.stateCode || undefined}
                  onValueChange={(stateCode) => {
                    if (stateCode !== entry.fields.stateCode) {
                      onChange(
                        value.map((e) =>
                          e.id === entry.id
                            ? { ...e, fields: { ...e.fields, stateCode, countyName: "" } }
                            : e,
                        ),
                      );
                    }
                  }}
                >
                  <SelectTrigger
                    style={{ width: "100%" }}
                    className={`${inputCls} cursor-pointer data-[placeholder]:text-white/70`}
                  >
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent
                    style={{ zIndex: Z_INDEX.modalDropdown }}
                    className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
                    position="popper"
                    sideOffset={4}
                  >
                    {STATES.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className={labelCls}>County</label>
                <CountyCombobox
                  value={entry.fields.countyName || ""}
                  onChange={(countyName) => updateField(entry.id, "countyName", countyName)}
                  counties={countiesForState(entry.fields.stateCode)}
                  disabled={!entry.fields.stateCode}
                  placeholder={entry.fields.stateCode ? "Select county" : "Select state first"}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Legal Description Type</label>
                <Select
                  value={tractType || undefined}
                  onValueChange={(nextType) => updateField(entry.id, "tractType", nextType)}
                >
                  <SelectTrigger
                    style={{ width: "100%" }}
                    className={`${inputCls} cursor-pointer data-[placeholder]:text-white/70`}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent
                    style={{ zIndex: Z_INDEX.modalDropdown }}
                    className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
                    position="popper"
                    sideOffset={4}
                  >
                    {TRACT_TYPE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {visibleLegalFields.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-3">
                {visibleLegalFields.map((field) =>
                  field.type === "textarea" ? (
                    <div key={field.id} className="col-span-3">
                      <label className={labelCls}>{field.label}</label>
                      <textarea
                        value={entry.fields[field.id] ?? ""}
                        onChange={(e) => updateField(entry.id, field.id, e.target.value)}
                        rows={field.rows || 4}
                        className="w-full bg-white/5 border border-purple-300/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors min-h-[100px]"
                      />
                    </div>
                  ) : (
                    <div key={field.id}>
                      <label className={labelCls}>{field.label}</label>
                      <input
                        type="text"
                        value={entry.fields[field.id] ?? ""}
                        onChange={(e) => updateField(entry.id, field.id, e.target.value)}
                        className={inputCls}
                      />
                    </div>
                  ),
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-purple-300/10">
              <div>
                <label className={labelCls}>Gross Acres</label>
                <input
                  type="number"
                  value={entry.grossAcres ?? ""}
                  onChange={(e) => updateEntry(entry.id, { grossAcres: numberOrNull(e.target.value) })}
                  placeholder="0.0000"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Net Acres</label>
                <input
                  type="number"
                  value={entry.netAcres ?? ""}
                  onChange={(e) => updateEntry(entry.id, { netAcres: numberOrNull(e.target.value) })}
                  placeholder="0.0000"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...value, newLegalDescriptionEntry()])}
        className={`cursor-pointer ${
          isLight
            ? "border-purple-600 text-purple-600 hover:bg-purple-50"
            : "bg-white/5 border-purple-400 text-purple-300 hover:bg-purple-500/20"
        }`}
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Legal Description
      </Button>
    </div>
  );
};

export default LegalDescriptionListField;
