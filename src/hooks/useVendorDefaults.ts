import { useCallback, useMemo } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { MOCK_VENDOR_DEFAULTS } from "../mocks/apInvoices";
import type { ApDuplicateRules, VendorDefaults, VendorDefaultsPatch } from "../types/apInvoices";

// gcTime is Infinity only while this is mocked: the cache is the only copy of the session's
// edits, so it must outlive every screen that reads it.
export const vendorDefaultsQuery = queryOptions({
  queryKey: ["vendorDefaults"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_VENDOR_DEFAULTS)
  queryFn: async (): Promise<Record<string, VendorDefaults>> => structuredClone(MOCK_VENDOR_DEFAULTS),
  staleTime: Infinity,
  gcTime: Infinity,
});

const EMPTY: Record<string, VendorDefaults> = {};

/** What a vendor gets until someone saves its A/P Vendor Info tab. */
export const fallbackVendorDefaults = (vendorId: string): VendorDefaults => ({
  vendorId,
  pay: "Yes",
  duplicateValidation: "Invoice #",
  sameAmountWindowDays: 60,
  apAccountId: "coa-2000",
  defaultExpenseAccountId: null,
  paymentTerms: "Net 30",
  type1099: null,
  box1099: null,
  remitToAddressType: "Payment",
});

export const duplicateRulesFor = (defaults: VendorDefaults): ApDuplicateRules => ({
  validateBy: defaults.duplicateValidation,
  windowDays: defaults.sameAmountWindowDays,
});

export const useVendorDefaults = (vendorId: string | null) => {
  const queryClient = useQueryClient();
  const { data = EMPTY, isLoading } = useQuery(vendorDefaultsQuery);

  const defaults = useMemo(
    () => (vendorId && data[vendorId]) || fallbackVendorDefaults(vendorId ?? ""),
    [data, vendorId],
  );

  const saveDefaults = useCallback(
    async (patch: VendorDefaultsPatch): Promise<VendorDefaults> => {
      if (!vendorId) throw new Error("Choose a vendor first");
      if (
        patch.sameAmountWindowDays !== undefined &&
        (!Number.isInteger(patch.sameAmountWindowDays) || patch.sameAmountWindowDays < 1)
      ) {
        throw new Error("Same-amount window must be a whole number of days");
      }
      // Mocked: no BE support yet — swap for executeGraphQL(UPDATE_VENDOR_DEFAULTS, { vendorId, ...patch })
      await queryClient.ensureQueryData(vendorDefaultsQuery);
      const all = queryClient.getQueryData(vendorDefaultsQuery.queryKey) ?? EMPTY;
      const saved: VendorDefaults = {
        ...(all[vendorId] ?? fallbackVendorDefaults(vendorId)),
        ...patch,
        vendorId,
      };
      queryClient.setQueryData(vendorDefaultsQuery.queryKey, { ...all, [vendorId]: saved });
      return saved;
    },
    [queryClient, vendorId],
  );

  return { defaults, loading: isLoading, saveDefaults };
};

/** Every stored vendor's defaults at once (check runs group by vendor). Vendors nobody has
 * saved yet aren't in byVendorId; defaultsFor fills them with the fallback. */
export const useAllVendorDefaults = () => {
  const { data = EMPTY, isLoading } = useQuery(vendorDefaultsQuery);
  const defaultsFor = useCallback(
    (vendorId: string): VendorDefaults => data[vendorId] ?? fallbackVendorDefaults(vendorId),
    [data],
  );
  return { byVendorId: data, loading: isLoading, defaultsFor };
};
