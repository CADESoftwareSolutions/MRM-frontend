import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

export interface NettingEntry {
  partyId: string;
  comments: string;
}

interface NettingTabProps {
  partyId?: number;
  entries: NettingEntry[];
  allParties: Array<{ id: string; name: string }>;
  onChange: (entries: NettingEntry[]) => void;
}

const commonInput = "bg-white/5 border-purple-300/30 text-white h-9";

export const NettingTab: React.FC<NettingTabProps> = ({
  partyId,
  entries,
  allParties,
  onChange,
}) => {
  if (!partyId) {
    return (
      <div className="flex items-center justify-center py-16 text-purple-300/70 text-sm">
        Save this record first to add netting entries.
      </div>
    );
  }

  const addRow = () => onChange([...entries, { partyId: "", comments: "" }]);

  const updateRow = (index: number, field: keyof NettingEntry, value: string) => {
    const next = entries.map((e, i) => (i === index ? { ...e, [field]: value } : e));
    onChange(next);
  };

  const removeRow = (index: number) => onChange(entries.filter((_, i) => i !== index));

  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-1">
          <Label className="text-white font-semibold text-sm">Name</Label>
          <Label className="text-white font-semibold text-sm">Name ID</Label>
          <Label className="text-white font-semibold text-sm">Comments</Label>
        </div>
      )}

      {entries.length === 0 && (
        <div className="text-center py-10 text-purple-300/70 text-sm">
          No netting entries added yet.
        </div>
      )}

      {entries.map((entry, i) => {
        const selectedParty = allParties.find((p) => p.id === entry.partyId);
        return (
          <div key={i} className="grid grid-cols-3 gap-4 items-center">
            <Select
              value={entry.partyId || undefined}
              onValueChange={(v) => updateRow(i, "partyId", v)}
            >
              <SelectTrigger className={`${commonInput} cursor-pointer`}>
                <SelectValue placeholder="Select a name" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto z-50">
                {allParties.map((p) => (
                  <SelectItem
                    key={p.id}
                    value={p.id}
                    className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
                  >
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={selectedParty?.id ?? ""}
              readOnly
              placeholder="—"
              className={`${commonInput} opacity-60 cursor-default`}
            />

            <div className="flex gap-2">
              <Input
                value={entry.comments}
                onChange={(e) => updateRow(i, "comments", e.target.value)}
                placeholder="Notes"
                className={commonInput}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeRow(i)}
                className="px-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 cursor-pointer shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        variant="ghost"
        onClick={addRow}
        className="w-full border border-dashed border-purple-300/30 text-purple-300 hover:text-white hover:bg-white/5 cursor-pointer h-10"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Another Name
      </Button>
    </div>
  );
};

export default NettingTab;
