import { useCallback, useEffect, useState } from "react";
import { DUPLICATE_VALIDATION_BE_VALUES, NO_1099 } from "@/config/contactsConfig";
import type { AutoComment } from "@/hooks/useContactDetails";
import { useVendorDefaults } from "@/hooks/useVendorDefaults";
import {
  DUPLICATE_VALIDATION_OPTIONS,
  DuplicateValidation,
  PAY_OPTIONS,
  PAYMENT_TERMS,
  PaymentTerms,
  VendorDefaults,
  VendorDefaultsPatch,
  VendorPay,
} from "@/types/apInvoices";

const REMIT_TO_FALLBACK_TYPES = ["Payment", "Mailing", "Physical"];

/** The address type checks go to: `preferred` when the contact has one, else Payment, Mailing,
 * Physical, else its first address. */
export const resolveRemitToType = (preferred: string | null | undefined, types: string[]): string => {
  if (preferred && types.includes(preferred)) return preferred;
  return REMIT_TO_FALLBACK_TYPES.find((type) => types.includes(type)) ?? types[0] ?? preferred ?? "";
};

const isVendorPay = (value: unknown): value is VendorPay => PAY_OPTIONS.includes(value as VendorPay);

export const duplicateValidationFromBe = (value: unknown): DuplicateValidation | null =>
  DUPLICATE_VALIDATION_OPTIONS.find((rule) => DUPLICATE_VALIDATION_BE_VALUES[rule] === value) ?? null;

export const VENDOR_FORM_FIELDS = [
  "pay",
  "duplicateInvoiceValidation",
  "sameAmountWindowDays",
  "apAccountId",
  "defaultExpenseAccountId",
  "paymentTerms",
  "type1099",
  "box1099",
  "remitToAddressType",
] as const;

export type VendorFormValues = Record<(typeof VENDOR_FORM_FIELDS)[number], string>;

interface VendorFormSource {
  /** The BE's vendorInfo values, when the contact has them. */
  pay?: unknown;
  duplicateInvoiceValidation?: unknown;
  /** The Tax tab's Type of 1099. */
  form1099Type?: string | null;
}

/** The A/P Vendor Info tab's starting values. Pay and duplicate validation come from the BE when
 * it has them, the rest from the stored vendor defaults. A 1099 Type that was never set (null)
 * starts from the Tax tab's Type of 1099; one saved as "" was set to None on purpose.
 * remitToAddressType is the stored preference; resolveRemitToType picks the address it means. */
export const vendorFormValues = (defaults: VendorDefaults, source: VendorFormSource = {}): VendorFormValues => ({
  pay: isVendorPay(source.pay) ? source.pay : defaults.pay,
  duplicateInvoiceValidation:
    DUPLICATE_VALIDATION_BE_VALUES[
      duplicateValidationFromBe(source.duplicateInvoiceValidation) ?? defaults.duplicateValidation
    ],
  sameAmountWindowDays: String(defaults.sameAmountWindowDays),
  apAccountId: defaults.apAccountId,
  defaultExpenseAccountId: defaults.defaultExpenseAccountId ?? "",
  paymentTerms: defaults.paymentTerms,
  type1099: defaults.type1099 === null ? source.form1099Type || "" : defaults.type1099 || NO_1099,
  box1099: defaults.box1099 ?? "",
  remitToAddressType: defaults.remitToAddressType,
});

const str = (value: unknown): string => (value === undefined || value === null ? "" : String(value));

const isPaymentTerms = (value: unknown): value is PaymentTerms => PAYMENT_TERMS.includes(value as PaymentTerms);

/** The useVendorDefaults patch for a saved vendor tab. Pay and duplicate validation go in too so
 * the A/P screens agree with what the BE stores. */
export const vendorDefaultsPatch = (values: Record<string, unknown>, addressTypes: string[]): VendorDefaultsPatch => {
  const type1099 = str(values.type1099);
  const box1099 = str(values.box1099);
  const patch: VendorDefaultsPatch = {
    defaultExpenseAccountId: str(values.defaultExpenseAccountId) || null,
    type1099: type1099 === NO_1099 ? "" : type1099 || null,
    box1099: box1099 && box1099 !== NO_1099 ? box1099 : null,
    remitToAddressType: resolveRemitToType(str(values.remitToAddressType), addressTypes),
  };
  if (isVendorPay(values.pay)) patch.pay = values.pay;
  const validation = duplicateValidationFromBe(values.duplicateInvoiceValidation);
  if (validation) patch.duplicateValidation = validation;
  const windowDays = Number(values.sameAmountWindowDays);
  if (Number.isInteger(windowDays) && windowDays > 0) patch.sameAmountWindowDays = windowDays;
  if (str(values.apAccountId)) patch.apAccountId = str(values.apAccountId);
  if (isPaymentTerms(values.paymentTerms)) patch.paymentTerms = values.paymentTerms;
  return patch;
};

const LABELS: [field: (typeof VENDOR_FORM_FIELDS)[number], label: string][] = [
  ["pay", "Pay"],
  ["duplicateInvoiceValidation", "Duplicate validation"],
  ["sameAmountWindowDays", "Same-amount window"],
  ["apAccountId", "A/P Account #"],
  ["defaultExpenseAccountId", "Default Expense Account"],
  ["paymentTerms", "Payment Terms"],
  ["type1099", "1099 Type"],
  ["box1099", "1099 Box"],
  ["remitToAddressType", "Remit-to address"],
];

const or1099None = (value: unknown) => (str(value) && value !== NO_1099 ? str(value) : NO_1099);

/** The vendor tab's values as they read in a comment, e.g. "2000 · PAYABLE" for an account. */
export const vendorDisplayValues = (
  values: Record<string, unknown>,
  addressTypes: string[],
  accountLabel: (id: string) => string,
): VendorFormValues => {
  const apAccountId = str(values.apAccountId);
  const expenseAccountId = str(values.defaultExpenseAccountId);
  const windowDays = str(values.sameAmountWindowDays);
  return {
    pay: str(values.pay),
    duplicateInvoiceValidation:
      duplicateValidationFromBe(values.duplicateInvoiceValidation) ?? str(values.duplicateInvoiceValidation),
    sameAmountWindowDays: windowDays ? `${windowDays} days` : "",
    apAccountId: apAccountId ? accountLabel(apAccountId) : "",
    defaultExpenseAccountId: expenseAccountId ? accountLabel(expenseAccountId) : "None",
    paymentTerms: str(values.paymentTerms),
    type1099: or1099None(values.type1099),
    box1099: or1099None(values.box1099),
    remitToAddressType: resolveRemitToType(str(values.remitToAddressType), addressTypes),
  };
};

/** One AUTO vendor comment for what a save changed on the vendor tab, e.g. "Pay changed from
 * Monthly to Check per entry." A new contact's choices read "set to". */
export const describeVendorChanges = (
  before: VendorFormValues,
  after: VendorFormValues,
  isNew: boolean,
): AutoComment[] => {
  const sentences = LABELS.flatMap(([field, label]) => {
    const prev = before[field];
    const next = after[field];
    if (!next || next === prev) return [];
    return [isNew || !prev ? `${label} set to ${next}.` : `${label} changed from ${prev} to ${next}.`];
  });
  return sentences.length > 0 ? [{ text: sentences.join(" "), category: "vendor" }] : [];
};

/** Saves vendor defaults once the vendor's id is known — a new contact only gets its party id
 * from the save. useVendorDefaults binds saveDefaults to one vendor, so the patch waits a render
 * for an instance bound to that id. */
export const useQueuedVendorDefaultsSave = () => {
  const [queued, setQueued] = useState<{ vendorId: string; patch: VendorDefaultsPatch } | null>(null);
  const { saveDefaults } = useVendorDefaults(queued?.vendorId ?? null);

  useEffect(() => {
    if (!queued) return;
    saveDefaults(queued.patch)
      .catch((error) => console.error("Failed to save vendor defaults:", error))
      .finally(() => setQueued(null));
  }, [queued, saveDefaults]);

  return useCallback(
    (vendorId: string, patch: VendorDefaultsPatch) => setQueued({ vendorId, patch }),
    [],
  );
};
