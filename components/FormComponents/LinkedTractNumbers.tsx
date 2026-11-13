import { Label } from "@/components/ui/label";
import type { TractLinkEntry } from "./TractPickerField";

interface LinkedTractNumbersProps {
  tracts: TractLinkEntry[];
}

// Read-only Tract # for a record's Basic Information tab: every tract linked on its Legal
// Descriptions tab, updating as they're added/removed there. Matches Form's own readonly field
// (Deed #) since it sits beside one.
export const LinkedTractNumbers = ({ tracts }: LinkedTractNumbersProps) => (
  <div>
    <Label className="form-field-label font-semibold flex items-center gap-1 mb-1 text-sm">Tract #</Label>
    <p className="h-9 flex items-center px-3 rounded-md bg-white/5 border border-purple-300/20 text-white/70 text-sm">
      <span className="truncate">
        {tracts.length
          ? tracts.map((tract) => tract.tractId).join(", ")
          : "Added on the Legal Descriptions tab"}
      </span>
    </p>
  </div>
);

export default LinkedTractNumbers;
