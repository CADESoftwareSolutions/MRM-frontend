import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { CountyReference } from "@/hooks/useStateCountyReference";
import { cn } from "@/lib/utils";

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
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const filteredCounties = React.useMemo(
    () => filterCounties(counties, value),
    [counties, value],
  );

  React.useEffect(() => {
    setActiveIndex(0);
  }, [value, counties]);

  React.useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectCounty = (county: CountyReference) => {
    onChange(county.name);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, filteredCounties.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && open && filteredCounties[activeIndex]) {
      event.preventDefault();
      selectCounty(filteredCounties[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div className="relative">
        <Input
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            className,
            "pr-9",
            invalid && "border-red-500",
          )}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-white/60" />
      </div>

      {open && !disabled && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-purple-300/30 bg-[#1a1a2e] p-1 shadow-lg"
        >
          {filteredCounties.length === 0 ? (
            <div className="px-2 py-2 text-sm text-white/60">No counties found</div>
          ) : (
            filteredCounties.map((county, index) => {
              const selected = normalizeCounty(county.name) === normalizeCounty(value);
              return (
                <button
                  key={`${county.stateCode}-${county.name}`}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectCounty(county)}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm text-white outline-none",
                    index === activeIndex
                      ? "bg-purple-400/40"
                      : "hover:bg-purple-400/30",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-3">
                    <span className="truncate">{countyLabel(county)}</span>
                    {countyFips(county) && (
                      <span className="shrink-0 text-xs text-white/50">
                        FIPS {countyFips(county)}
                      </span>
                    )}
                  </span>
                  {selected && <Check className="size-4 shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
