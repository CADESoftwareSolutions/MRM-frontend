import type { CountyReference, StateCountyReference } from "@/hooks/useStateCountyReference";

const withCode = (name: string, code?: string | null) => (code ? `${code} - ${name}` : name);

/** A state's 2-digit FIPS code. The reference data only carries it per county, and every county
 * in a state shares it, so take it from the first one that has it. */
export const stateFips = (state: StateCountyReference) =>
  state.counties.find((county) => county.fipsState)?.fipsState ?? null;

/** Lowercased, with a trailing "County"/"Parish"/"Borough"/"Census Area" dropped, so a typed-in
 * "Gregg County" matches the reference data's "Gregg". */
export const normalizeCountyName = (value: string) =>
  value.toLowerCase().replace(/\s+(county|parish|borough|census area)$/i, "").trim();

export const findCounty = (counties: CountyReference[], countyName: string) => {
  const target = normalizeCountyName(countyName);
  return counties.find((county) => normalizeCountyName(county.name) === target);
};

/** "48 - Texas". */
export const stateNameWithCode = (state: StateCountyReference) => withCode(state.name, stateFips(state));

/** "389 - Reeves County": the county's 3-digit FIPS code and full name when the reference data has
 * them, otherwise just the name as given. */
export const countyNameWithCode = (counties: CountyReference[], countyName: string) => {
  const county = findCounty(counties, countyName);
  return withCode(county?.fullName || countyName, county?.fipsCounty);
};

/** For read-only State lines. Falls back to the bare code if it isn't in the reference data. */
export const formatStateWithCode = (
  reference: StateCountyReference[],
  stateCode?: string | null,
): string => {
  if (!stateCode) return "—";
  const state = reference.find((s) => s.code === stateCode);
  return state ? stateNameWithCode(state) : stateCode;
};

/** For read-only County lines. */
export const formatCountyWithCode = (
  reference: StateCountyReference[],
  stateCode?: string | null,
  countyName?: string | null,
): string => {
  if (!countyName) return "—";
  const counties = reference.find((s) => s.code === stateCode)?.counties ?? [];
  return countyNameWithCode(counties, countyName);
};
