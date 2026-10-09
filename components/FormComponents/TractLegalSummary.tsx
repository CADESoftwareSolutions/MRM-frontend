import { TractOption } from "@/hooks/useTracts";
import { TRACT_TYPE_LABELS, visibleLegalFieldsFor } from "./legalDescriptionFields";

const labelCls = "block text-xs font-medium text-purple-200 mb-1";

interface TractLegalSummaryProps {
  tract: TractOption;
  isLight: boolean;
  /** 3 for the full-width linked-entry card; 2 for the narrower duplicate-match popup. */
  columns?: 2 | 3;
}

// Read-only "what does this Tract's legal description say" block — shared by TractPickerField's
// linked-entry cards and LegalDescriptionForm's duplicate-match popup (so a user can see enough
// to tell matches apart before picking one), rather than each re-deriving the same field set.
export const TractLegalSummary = ({ tract, isLight, columns = 3 }: TractLegalSummaryProps) => {
  const visibleLegalFields = visibleLegalFieldsFor(tract.tractType);
  const textCls = isLight ? "text-gray-800" : "text-white";

  return (
    <div className={columns === 2 ? "grid grid-cols-2 gap-3" : "grid grid-cols-3 gap-3"}>
      <div>
        <label className={labelCls}>Legal Description Type</label>
        <p className={`text-sm ${textCls}`}>
          {TRACT_TYPE_LABELS[tract.tractType ?? ""] || tract.tractType || "—"}
        </p>
      </div>
      <div>
        <label className={labelCls}>State</label>
        <p className={`text-sm ${textCls}`}>{tract.stateCode || "—"}</p>
      </div>
      <div>
        <label className={labelCls}>County</label>
        <p className={`text-sm ${textCls}`}>{tract.countyName || "—"}</p>
      </div>
      {visibleLegalFields.map((field) =>
        field.type === "textarea" ? (
          <div key={field.id} className={columns === 2 ? "col-span-2" : "col-span-3"}>
            <label className={labelCls}>{field.label}</label>
            <p className={`text-sm whitespace-pre-wrap ${textCls}`}>{(tract as any)[field.id] || "—"}</p>
          </div>
        ) : (
          <div key={field.id}>
            <label className={labelCls}>{field.label}</label>
            <p className={`text-sm ${textCls}`}>{(tract as any)[field.id] || "—"}</p>
          </div>
        ),
      )}
    </div>
  );
};

export default TractLegalSummary;
