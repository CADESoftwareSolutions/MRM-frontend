import { queryOptions, useQuery } from "@tanstack/react-query";

/** Company-wide defaults (Settings › Accounting) that individual records can override. */
export interface CompanySettings {
  /** Revenue below this is held for an owner until it adds up, unless the owner's record overrides it. */
  minimumPaymentAmount: number;
  /** Printed on checks; unset until Settings › Company exists, so checks fall back to the account name. */
  companyName?: string;
  companyAddressLines?: string[];
}

const MOCK_COMPANY_SETTINGS: CompanySettings = {
  minimumPaymentAmount: 25,
};

export const companySettingsQuery = queryOptions({
  queryKey: ["companySettings"],
  // Mocked: no BE support yet — swap for executeGraphQL(FETCH_COMPANY_SETTINGS)
  queryFn: async (): Promise<CompanySettings> => structuredClone(MOCK_COMPANY_SETTINGS),
  staleTime: Infinity,
});

/** settings is null until loaded. */
export const useCompanySettings = () => {
  const { data, isLoading } = useQuery(companySettingsQuery);
  return { settings: data ?? null, loading: isLoading };
};

export default useCompanySettings;
