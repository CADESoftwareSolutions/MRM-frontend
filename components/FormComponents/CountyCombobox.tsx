import * as React from "react";
import { Check } from "lucide-react";

import type { CountyReference } from "@/hooks/useStateCountyReference";
import { cn } from "@/lib/utils";
import { ComboboxBase } from "./ComboboxBase";

interface CountyComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  counties: CountyReference[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  invalid?: boolean;
}

const normalizeCounty = (value: string) =>
  value.toLowerCase().replace(/\s+(county|parish|borough|census area)$/i, "").trim();

const countyLabel = (county: CountyReference) => county.fullName || county.name;

/** 3-digit county FIPS (e.g. Reeves → 389). */
const countyFips = (county: CountyReference) => county.fipsCounty || null;

const fullFipsCode = (county: CountyReference) =>
  county.fipsState && county.fipsCounty
    ? `${county.fipsState}${county.fipsCounty}`
    : countyFips(county);

const filterCounties = (counties: CountyReference[], input: string) => {
  const query = normalizeCounty(input);
  const fipsQuery = input.trim();
  if (!query && !fipsQuery) return counties.slice(0, 25);

  const scored = counties
    .map((county) => {
      const name = normalizeCounty(county.name);
      const label = normalizeCounty(countyLabel(county));
      const fips = countyFips(county) ?? "";
      const fullFips = fullFipsCode(county) ?? "";

      if (fipsQuery && (fips === fipsQuery || fullFips === fipsQuery)) {
        return { county, score: 0 };
      }
      if (fipsQuery && (fips.startsWith(fipsQuery) || fullFips.startsWith(fipsQuery))) {
        return { county, score: 1 };
      }
      if (name === query || label === query) return { county, score: 0 };
      if (name.startsWith(query) || label.startsWith(query)) return { county, score: 1 };
      if (name.includes(query) || label.includes(query)) return { county, score: 2 };
      return null;
    })
    .filter(Boolean) as Array<{ county: CountyReference; score: number }>;

  return scored
    .sort((a, b) => a.score - b.score || countyLabel(a.county).localeCompare(countyLabel(b.county)))
    .slice(0, 25)
    .map(({ county }) => county);
};

export const CountyCombobox: React.FC<CountyComboboxProps> = ({
  value = "",
  onChange,
  onBlur,
  counties,
  disabled = false,
  placeholder = "Select county",
  className,
  invalid,
}) => {
  const filteredCounties = React.useMemo(() => filterCounties(counties, value), [counties, value]);

  return (
    <ComboboxBase
      inputValue={value}
      onInputChange={onChange}
      onBlur={onBlur}
      items={filteredCounties}
      getKey={(county) => `${county.stateCode}-${county.name}`}
      onSelect={(county) => onChange(county.name)}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      invalid={invalid}
      emptyMessage="No counties found"
      renderItem={(county, isActive, select) => {
        const selected = normalizeCounty(county.name) === normalizeCounty(value);
        return (
          <button
            type="button"
            role="option"
            aria-selected={selected}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => select(county)}
            className={cn(
              "flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none",
              isActive ? "bg-purple-400/40" : "hover:bg-purple-400/30",
            )}
          >
            <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="truncate">{countyLabel(county)}</span>
              {countyFips(county) && (
                <span className="shrink-0 text-xs text-white/50">FIPS {countyFips(county)}</span>
              )}
            </span>
            {selected && <Check className="size-4 shrink-0" />}
          </button>
        );
      }}
    />
  );
};
