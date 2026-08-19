import { useState } from "react";
import { useAtom } from "jotai";
import { X } from "lucide-react";
import { themeAtom } from "@/atoms/NavigationAtom";
import { useLeaseCrossReferences } from "@/hooks/useLeaseCrossReferences";
import { CrossReferencePicker, inputCls } from "./CrossReferencePicker";
import { LinkedRowsTable, numberOrNull } from "./CrossReferenceTable";

interface LeaseCrossReferencesTabProps {
  leaseId?: number | null;
  accountId: number;
}

// No "Name" section here — unlike title_document_party for Deeds, the backend has no
// lease_party table, so there's nowhere to store a lease-to-Directory-name cross-reference.
export const LeaseCrossReferencesTab = ({ leaseId, accountId }: LeaseCrossReferencesTabProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const [pendingCost, setPendingCost] = useState("");

  const {
    error,
    clearError,
    linkedWells,
    linkedAcquisitions,
    linkedDeeds,
    wellOptions,
    acquisitionOptions,
    deedOptions,
    addWell,
    removeWell,
    addAcquisition,
    updateAcquisitionCost,
    removeAcquisition,
    addDeed,
    removeDeed,
  } = useLeaseCrossReferences({ leaseId, accountId });

  if (leaseId == null) {
    return (
      <p className="text-center text-sm text-purple-300/70 py-6 border border-dashed border-purple-300/30 rounded-lg">
        Save to enable cross-references.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/40">
          <p className="text-xs text-red-300">{error}</p>
          <button type="button" onClick={clearError} className="text-red-400 hover:text-red-200 cursor-pointer shrink-0">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Acquisition Name and Cost */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
          Acquisition Name and Cost
        </h3>
        <CrossReferencePicker
          options={acquisitionOptions}
          excludeIds={new Set(linkedAcquisitions.map((a) => a.acquisitionId))}
          placeholder="Search acquisitions by name"
          onAdd={(option) => {
            addAcquisition(option.id, numberOrNull(pendingCost));
            setPendingCost("");
          }}
          extraControl={
            <input
              type="number"
              value={pendingCost}
              onChange={(e) => setPendingCost(e.target.value)}
              placeholder="Cost paid for this lease"
              className={`${inputCls} w-56`}
            />
          }
        />
        <LinkedRowsTable
          rows={linkedAcquisitions.map((a) => ({
            id: a.id,
            primary: a.name,
            secondary: (
              <input
                type="number"
                value={a.cost ?? ""}
                onChange={(e) => updateAcquisitionCost(a.id, numberOrNull(e.target.value))}
                className={inputCls}
              />
            ),
          }))}
          emptyMessage="No acquisition linked yet."
          nameHeader="Acquisition"
          extraHeader="Cost"
          onRemove={removeAcquisition}
          isLight={isLight}
        />
      </div>

      <div className="border-t border-purple-300/30 pt-4">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-3">
          Cross-Reference Lease to
        </h3>

        <div className="space-y-5">
          {/* Wells */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-purple-200">Well</label>
            <CrossReferencePicker
              options={wellOptions}
              excludeIds={new Set(linkedWells.map((w) => w.wellId))}
              placeholder="Search wells by name"
              onAdd={(option) => addWell(option.id)}
            />
            <LinkedRowsTable
              rows={linkedWells.map((w) => ({ id: w.id, primary: w.name }))}
              emptyMessage="No wells referenced yet."
              nameHeader="Well"
              onRemove={removeWell}
              isLight={isLight}
            />
          </div>

          {/* Deeds */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-purple-200">Deed</label>
            <CrossReferencePicker
              options={deedOptions}
              excludeIds={new Set(linkedDeeds.map((d) => d.deedId))}
              placeholder="Search deeds by grantor or type"
              onAdd={(option) => addDeed(option.id)}
            />
            <LinkedRowsTable
              rows={linkedDeeds.map((d) => ({ id: d.id, primary: d.name }))}
              emptyMessage="No deeds referenced yet."
              nameHeader="Deed"
              onRemove={removeDeed}
              isLight={isLight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseCrossReferencesTab;
