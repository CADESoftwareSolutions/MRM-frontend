import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { themeAtom } from "@/atoms/NavigationAtom";
import { acquisitionsQuery } from "@/hooks/useAcquisitions";
import { Z_INDEX } from "@/lib/zIndex";
import { AddAcquisitionModal } from "../modals/AddAcquisitionModal";

/** A saved deed↔acquisition link (title_document_acquisition row). */
export interface DeedAcquisitionLink {
  id: number;
  acquisitionId: number;
  acquisitionName: string;
  allocatedCost: number | null;
}

/** The picker's editable state, held as the strings the select and input work with. */
export interface AcquisitionLinkValue {
  /** "" when no acquisition is selected. */
  acquisitionId: string;
  /** Shown if the selected acquisition isn't in the fetched list (still loading, or just created). */
  acquisitionName: string;
  /** "" when no cost is entered. */
  allocatedCost: string;
}

export const EMPTY_ACQUISITION_LINK: AcquisitionLinkValue = {
  acquisitionId: "",
  acquisitionName: "",
  allocatedCost: "",
};

// Newest first: the picker edits only links[0], and switching acquisitions is a delete + create,
// so this keeps the link it just made in that slot even when the deed has other links too.
export const transformAcquisitionLinks = (links: any[]): DeedAcquisitionLink[] =>
  (links || [])
    .map((link) => ({
      id: Number(link.id),
      acquisitionId: Number(link.acquisitionId),
      acquisitionName: link.acquisition?.name || "",
      allocatedCost: link.allocatedCost ?? null,
    }))
    .sort((a, b) => b.id - a.id);

export const toAcquisitionLinkValue = (link?: DeedAcquisitionLink | null): AcquisitionLinkValue =>
  link
    ? {
        acquisitionId: String(link.acquisitionId),
        acquisitionName: link.acquisitionName,
        allocatedCost: link.allocatedCost == null ? "" : String(link.allocatedCost),
      }
    : EMPTY_ACQUISITION_LINK;

// Radix Select reserves "" for "nothing selected", so clearing the selection needs its own value.
const NO_ACQUISITION = "__none__";

const inputClasses = "bg-white/5 border-purple-300/30 text-white h-9";
const labelClasses = "form-field-label font-semibold flex items-center gap-1 text-sm";
const itemClasses =
  "hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white";

interface AcquisitionPickerFieldProps {
  value: AcquisitionLinkValue;
  onChange: (next: AcquisitionLinkValue) => void;
  accountId: number;
  /** Acquisitions the deed already links through rows this picker doesn't edit (it only edits
   * the first link). Disabled here, since picking one would hit the BE's unique (deed,
   * acquisition) constraint. */
  lockedAcquisitionIds?: number[];
}

export const AcquisitionPickerField = ({
  value,
  onChange,
  accountId,
  lockedAcquisitionIds = [],
}: AcquisitionPickerFieldProps) => {
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: acquisitions, isLoading } = useQuery(acquisitionsQuery);

  const options = useMemo(() => {
    const list = (acquisitions ?? []).map((acquisition) => ({
      id: String(acquisition.id),
      name: acquisition.name || `Acquisition #${acquisition.id}`,
    }));
    if (value.acquisitionId && !list.some((option) => option.id === value.acquisitionId)) {
      list.push({
        id: value.acquisitionId,
        name: value.acquisitionName || `Acquisition #${value.acquisitionId}`,
      });
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [acquisitions, value.acquisitionId, value.acquisitionName]);

  const locked = new Set(lockedAcquisitionIds.map(String));

  return (
    <div className="grid grid-cols-3 gap-x-4">
      <div className="col-span-2">
        <div className="flex items-center gap-1 mb-1">
          <Label className={labelClasses}>Acquisition</Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Add a new acquisition"
                onClick={() => setAddModalOpen(true)}
                // -my-1 offsets the padding so this row stays as tall as its neighbours' plain
                // labels (Acres, Cost) and the select below lines up with their inputs.
                className={`-my-1 p-1 rounded-full transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60 ${
                  isLight
                    ? "text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                    : "text-purple-300 hover:text-purple-100 hover:bg-purple-500/20"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              sideOffset={4}
              // Portals to <body>, where a plain z-50 would slide under the fixed app bar.
              style={{ zIndex: Z_INDEX.modalDropdown }}
              className={isLight ? undefined : "border border-purple-300/30"}
            >
              {"If you don't see your acquisition, add it here"}
            </TooltipContent>
          </Tooltip>
        </div>

        <Select
          value={value.acquisitionId}
          onValueChange={(next) => {
            if (next === NO_ACQUISITION) {
              onChange(EMPTY_ACQUISITION_LINK);
              return;
            }
            const option = options.find((o) => o.id === next);
            onChange({ ...value, acquisitionId: next, acquisitionName: option?.name ?? "" });
          }}
        >
          <SelectTrigger
            style={{ width: "100%" }}
            className={`${inputClasses} cursor-pointer data-[placeholder]:text-white/70`}
          >
            <SelectValue placeholder="Select acquisition" />
          </SelectTrigger>
          <SelectContent
            style={{ zIndex: Z_INDEX.modalDropdown }}
            className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
            position="popper"
            sideOffset={4}
          >
            <SelectItem value={NO_ACQUISITION} className={`${itemClasses} italic`}>
              No acquisition
            </SelectItem>
            {options.length === 0 && (
              <p className={`px-2 py-1.5 text-xs ${isLight ? "text-gray-500" : "text-white/60"}`}>
                {isLoading ? "Loading acquisitions..." : "No acquisitions yet"}
              </p>
            )}
            {options.map((option) => {
              const isLocked = locked.has(option.id);
              return (
                <SelectItem key={option.id} value={option.id} disabled={isLocked} className={itemClasses}>
                  {option.name}
                  {isLocked && <span className="text-xs opacity-80">(linked separately)</span>}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className={`${labelClasses} mb-1`}>Cost ($)</Label>
        <Input
          type="number"
          value={value.allocatedCost}
          onChange={(e) => onChange({ ...value, allocatedCost: e.target.value })}
          disabled={!value.acquisitionId}
          placeholder="0.00"
          className={inputClasses}
        />
      </div>

      {addModalOpen && (
        <AddAcquisitionModal
          accountId={accountId}
          isLight={isLight}
          onClose={() => setAddModalOpen(false)}
          onCreated={(acquisition) => {
            onChange({ ...value, acquisitionId: acquisition.id, acquisitionName: acquisition.name });
            setAddModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default AcquisitionPickerField;
