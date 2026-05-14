import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useAtom } from "jotai";

export type LegalDescType =
  | "Block/Section/Survey"
  | "Rectangular (STR)"
  | "Metes and Bounds"
  | "Freeform";

export interface LegalDescriptionEntry {
  id: string;
  type: LegalDescType;
  block?: string;
  township?: string;
  section?: string;
  abstract?: string;
  survey?: string;
  lot?: string;
  range?: string;
  quarterCalls?: string;
  legalDescription?: string;
  upi?: string;
}

interface MultiLegalDescriptionFieldProps {
  value: LegalDescriptionEntry[];
  onChange: (entries: LegalDescriptionEntry[]) => void;
  showValidation?: boolean;
}

const LEGAL_DESC_TYPES: LegalDescType[] = [
  "Block/Section/Survey",
  "Rectangular (STR)",
  "Metes and Bounds",
  "Freeform",
];

const newEntry = (): LegalDescriptionEntry => ({
  id: `ld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  type: "Block/Section/Survey",
});

const inputCls =
  "w-full h-9 bg-white/5 border border-purple-300/30 rounded-md px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors";
const labelCls = "block text-xs font-medium text-purple-200 mb-1";
const textareaCls =
  "w-full bg-white/5 border border-purple-300/30 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-400 transition-colors resize-none";

const Field = ({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => (
  <div>
    <label className={labelCls}>{label}</label>
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
    />
  </div>
);

const TextareaField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
}) => (
  <div className="col-span-2">
    <label className={labelCls}>{label}</label>
    <textarea
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      rows={6}
      className={textareaCls}
    />
  </div>
);

const EntryFields = ({
  entry,
  onUpdate,
}: {
  entry: LegalDescriptionEntry;
  onUpdate: (patch: Partial<LegalDescriptionEntry>) => void;
}) => {
  const f = (key: keyof LegalDescriptionEntry) => (v: string) =>
    onUpdate({ [key]: v });

  switch (entry.type) {
    case "Block/Section/Survey":
      return (
        <>
          <div className="grid grid-cols-2 gap-3 col-span-2">
            <Field label="Block" value={entry.block} onChange={f("block")} />
            <Field
              label="Township"
              value={entry.township}
              onChange={f("township")}
            />
          </div>
          <Field
            label="Section"
            value={entry.section}
            onChange={f("section")}
          />
          <Field
            label="Abstract"
            value={entry.abstract}
            onChange={f("abstract")}
          />
          <Field label="Survey" value={entry.survey} onChange={f("survey")} />
          <Field
            label="Quarter Calls/Aliquot"
            value={entry.quarterCalls}
            onChange={f("quarterCalls")}
          />
          <Field
            label="UPI (if applicable)"
            value={entry.upi}
            onChange={f("upi")}
          />
        </>
      );

    case "Rectangular (STR)":
      return (
        <>
          <div className="grid grid-cols-2 gap-3 col-span-2">
            <Field label="Lot" value={entry.lot} onChange={f("lot")} />
            <Field label="Block" value={entry.block} onChange={f("block")} />
          </div>
          <Field
            label="Section"
            value={entry.section}
            onChange={f("section")}
          />
          <Field
            label="Township"
            value={entry.township}
            onChange={f("township")}
          />
          <Field label="Range" value={entry.range} onChange={f("range")} />
          <Field
            label="Quarter Calls/Aliquot"
            value={entry.quarterCalls}
            onChange={f("quarterCalls")}
          />
          <Field
            label="UPI (if applicable)"
            value={entry.upi}
            onChange={f("upi")}
          />
        </>
      );

    case "Metes and Bounds":
    case "Freeform":
      return (
        <>
          <Field label="Block" value={entry.block} onChange={f("block")} />
          <Field
            label="Section"
            value={entry.section}
            onChange={f("section")}
          />
          <Field label="Survey" value={entry.survey} onChange={f("survey")} />
          <Field
            label="Quarter Calls/Aliquot"
            value={entry.quarterCalls}
            onChange={f("quarterCalls")}
          />
          <Field
            label="UPI (if applicable)"
            value={entry.upi}
            onChange={f("upi")}
          />
          <TextareaField
            label="Legal Description"
            value={entry.legalDescription}
            onChange={f("legalDescription")}
          />
        </>
      );
  }
};

export const MultiLegalDescriptionField = ({
  value,
  onChange,
  showValidation,
}: MultiLegalDescriptionFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  const update = (id: string, patch: Partial<LegalDescriptionEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const remove = (id: string) => onChange(value.filter((e) => e.id !== id));

  const copy = (entry: LegalDescriptionEntry, index: number) => {
    const clone: LegalDescriptionEntry = {
      ...entry,
      id: `ld-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    const next = [...value];
    next.splice(index + 1, 0, clone);
    onChange(next);
  };

  const isEmpty = value.length === 0;

  return (
    <div className="space-y-4">
      {isEmpty && showValidation && (
        <p className="text-red-400 text-sm">
          At least one legal description is required.
        </p>
      )}

      {value.map((entry, index) => (
        <div
          key={entry.id}
          className={`border rounded-xl p-4 ${
            isEmpty && showValidation
              ? "border-red-400/60"
              : "border-purple-300/20"
          } bg-white/5`}
        >
          {/* Card header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-purple-300 uppercase tracking-wide">
              Legal #{index + 1}
            </span>
            <div className="flex-1">
              <select
                value={entry.type}
                onChange={(e) =>
                  update(entry.id, { type: e.target.value as LegalDescType })
                }
                className="h-8 bg-white/5 border border-purple-300/30 rounded-md px-2 text-sm text-white outline-none focus:border-purple-400 cursor-pointer"
              >
                {LEGAL_DESC_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#1a1a2e]">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => copy(entry, index)}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  isLight
                    ? "text-gray-400 hover:text-purple-600 hover:bg-purple-100"
                    : "text-purple-300/50 hover:text-purple-200 hover:bg-purple-500/20"
                }`}
                title="Copy this entry"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                className="p-1.5 rounded transition-colors cursor-pointer text-red-400/60 hover:text-red-300 hover:bg-red-500/20"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2 gap-3">
            <EntryFields
              entry={entry}
              onUpdate={(patch) => update(entry.id, patch)}
            />
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() => onChange([...value, newEntry()])}
        className="border-purple-300/30 text-purple-600 hover:bg-purple-500/20 hover:text-white cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Legal Description
      </Button>
    </div>
  );
};
