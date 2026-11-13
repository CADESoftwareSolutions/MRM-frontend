import React from "react";
import { Plus } from "lucide-react";
import { badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { normalizeClassification } from "@/hooks/useContactDetails";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";

interface CustomClassificationAddonProps {
  value: string[] | undefined;
  onChange: (value: string[]) => void;
  /** Every badge already offered (built-in + custom), so a repeat just selects the existing one. */
  existingOptions: string[];
  onCreate: (name: string) => Promise<string>;
  isLight: boolean;
}

export const CustomClassificationAddon = ({
  value,
  onChange,
  existingOptions,
  onCreate,
  isLight,
}: CustomClassificationAddonProps) => {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const add = async () => {
    const normalized = normalizeClassification(name);
    if (!normalized) return;
    setSaving(true);
    setError(null);
    try {
      const created = existingOptions.includes(normalized) ? normalized : await onCreate(normalized);
      const selected = value ?? [];
      if (!selected.includes(created)) onChange([...selected, created]);
      setName("");
      setOpen(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            badgeVariants({ variant: "outline" }),
            "cursor-pointer border-dashed border-purple-300/50 text-purple-300 hover:bg-white/10",
          )}
        >
          <Plus aria-hidden="true" />
          Custom
        </button>
      </PopoverTrigger>
      <PopoverContent style={{ zIndex: Z_INDEX.modalDropdown }} className="w-72">
        {/* Portaled outside the page's .light-theme wrapper, so the theme class is reapplied here. */}
        <div className={`space-y-2 ${isLight ? "light-theme" : ""}`}>
          <p className="text-sm font-semibold text-white">New classification type</p>
          <Input
            autoFocus
            value={name}
            maxLength={30}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="e.g. ROYALTY TRUST"
            className="bg-white/5 border-purple-300/30 text-white h-9"
          />
          <p className="form-help-text text-xs">Added for your whole company and selected on this contact.</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              disabled={!name.trim() || saving}
              onClick={add}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              Add type
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CustomClassificationAddon;
