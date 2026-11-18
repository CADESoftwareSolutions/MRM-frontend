import { FormEvent, useId, useState } from "react";
import { useAtomValue } from "jotai";
import { Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { themeAtom } from "@/atoms/NavigationAtom";
import { TaxDeductTypeInput } from "@/hooks/useTaxDeductTypes";
import { TaxDeductKind, TaxDeductType, normalizeLabel } from "@/types/revenue";
import { Modal, ModalHeader } from "../../../modals/Modal";
import { AccountPicker } from "../../AccountPicker";
import { KIND_LABEL, pickerCategories } from "./typesModel";

export interface TaxDeductTypeModalProps {
  /** The label being edited; omit to add one. Editing covers the label and type only, since the
   * account is picked inline in the table. */
  type?: TaxDeductType;
  defaultKind?: TaxDeductKind;
  /** Throws with a message to show (e.g. a duplicate label). */
  onSave: (input: TaxDeductTypeInput) => Promise<void>;
  onCancel: () => void;
}

const KINDS: TaxDeductKind[] = ["tax", "deduct"];

export const TaxDeductTypeModal = ({ type, defaultKind = "tax", onSave, onCancel }: TaxDeductTypeModalProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  const fieldId = useId();
  const [label, setLabel] = useState(type?.label ?? "");
  const [kind, setKind] = useState<TaxDeductKind>(type?.kind ?? defaultKind);
  const [accountId, setAccountId] = useState<string | null>(type?.accountId ?? null);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cleanLabel = normalizeLabel(label);
  const stopsMatching =
    !!type && type.lineCount > 0 && !!cleanLabel && (cleanLabel !== type.label || kind !== type.kind);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!cleanLabel) {
      setError("Enter the label as it's printed on the check stub.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ label: cleanLabel, kind, accountId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save this label.");
      setSaving(false);
    }
  };

  const fieldLabel = "text-white font-semibold flex items-center gap-1 mb-1 text-sm";
  const help = "text-xs text-white/60 mt-1";

  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-lg" isLight={isLight}>
      <ModalHeader
        title={type ? "Edit Label" : "Add Label"}
        icon={<Tag className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
        onClose={onCancel}
        isLight={isLight}
      />
      <form onSubmit={submit} noValidate className="p-6 flex flex-col gap-5">
        <div>
          <Label htmlFor={`${fieldId}-label`} className={fieldLabel}>
            Label
            <span className="text-red-500 text-sm font-bold">*</span>
          </Label>
          <Input
            id={`${fieldId}-label`}
            autoFocus
            autoComplete="off"
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. TX SEVERANCE TAXES"
            aria-invalid={!!error}
            aria-describedby={`${fieldId}-label-help`}
            className="h-9 uppercase placeholder:normal-case bg-white/5 border-purple-300/30 text-white"
          />
          <p id={`${fieldId}-label-help`} className={help}>
            Exactly as printed on the check stub.
          </p>
        </div>

        <div>
          <p id={`${fieldId}-kind`} className={fieldLabel}>
            Type
          </p>
          <div
            role="group"
            aria-labelledby={`${fieldId}-kind`}
            className="inline-flex gap-1 p-1 rounded-xl bg-white/5 border border-purple-300/20"
          >
            {KINDS.map((option) => {
              const active = kind === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setKind(option);
                    if (error) setError(null);
                  }}
                  className={`inline-flex h-8 items-center rounded-lg px-4 text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? "bg-purple-600 text-white"
                      : isLight
                        ? "text-purple-700 hover:bg-purple-200/60"
                        : "text-purple-100 hover:bg-purple-500/30 hover:text-white"
                  }`}
                >
                  {KIND_LABEL[option]}
                </button>
              );
            })}
          </div>
        </div>

        {!type && (
          <div>
            <Label htmlFor={`${fieldId}-account`} className={fieldLabel}>
              Maps to account
            </Label>
            <AccountPicker
              id={`${fieldId}-account`}
              value={accountId}
              onChange={(id) => setAccountId(id)}
              onClear={() => setAccountId(null)}
              categories={pickerCategories(kind, showAllCategories)}
              placeholder="Choose account"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-white/60">Optional. Without one, the label waits under Needs an account.</p>
              <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-white/70 cursor-pointer">
                <Switch
                  checked={showAllCategories}
                  onCheckedChange={setShowAllCategories}
                  className={`cursor-pointer data-[state=checked]:bg-purple-600 ${
                    isLight ? "data-[state=unchecked]:bg-purple-200" : "data-[state=unchecked]:bg-white/20"
                  }`}
                />
                All categories
              </label>
            </div>
          </div>
        )}

        {stopsMatching && (
          <p
            className={`rounded-lg border px-3 py-2 text-xs ${
              isLight
                ? "bg-yellow-50 border-yellow-300 text-yellow-800"
                : "bg-yellow-500/10 border-yellow-400/30 text-yellow-200"
            }`}
          >
            Checks find this mapping by printed label and type, so lines printed as{" "}
            <span className="font-semibold">
              {type.label} ({KIND_LABEL[type.kind]})
            </span>{" "}
            will stop using it, and the next import that prints it adds it back as a new label. Checks
            already posted keep the account they posted to.
          </p>
        )}

        {error && (
          <p role="alert" className="text-red-400 text-xs">
            {error}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white cursor-pointer"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
            {type ? "Save" : "Add Label"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TaxDeductTypeModal;
