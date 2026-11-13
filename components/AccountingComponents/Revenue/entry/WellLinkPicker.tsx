import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Link2, Search, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useWellOptions, type WellOption } from "@/hooks/useWellOptions";
import { Z_INDEX } from "@/lib/zIndex";
import { cn } from "@/lib/utils";
import { useEntryTheme } from "./entryTheme";

export interface LinkedWell {
  id: string;
  label: string;
}

interface WellLinkPickerProps {
  wellId: string | null;
  wellLabel: string | null;
  /** Used to put the likely wells first before the user searches. */
  propertyDescription: string;
  onLink: (well: LinkedWell | null) => void;
  disabled?: boolean;
}

const MAX_ROWS = 50;

const tokenize = (text: string) => text.trim().toLowerCase().split(/[\s,·#-]+/).filter(Boolean);

const searchText = (well: WellOption) =>
  [well.label, well.leaseName, well.wellNumber, well.apiNumber, well.operatorName, well.countyName, well.stateCode]
    .join(" ")
    .toLowerCase();

const wellDetails = (well: WellOption) =>
  [
    well.apiNumber && `API ${well.apiNumber}`,
    well.operatorName,
    [well.countyName, well.stateCode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");

/** The group header's well link: a "Link to a well" button, or the linked well as a badge that
 * reopens the search to change or remove it. */
export const WellLinkPicker = ({
  wellId,
  wellLabel,
  propertyDescription,
  onLink,
  disabled = false,
}: WellLinkPickerProps) => {
  const theme = useEntryTheme();
  const { wells, loading } = useWellOptions();
  const searchRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const linked = Boolean(wellId || wellLabel);

  const indexed = useMemo(() => wells.map((well) => ({ well, text: searchText(well) })), [wells]);

  const rows = useMemo(() => {
    const tokens = tokenize(query);
    if (tokens.length) {
      return indexed
        .filter((entry) => tokens.every((token) => entry.text.includes(token)))
        .slice(0, MAX_ROWS)
        .map((entry) => ({ well: entry.well, suggested: false }));
    }
    const propertyTokens = tokenize(propertyDescription);
    return indexed
      .map((entry) => ({ ...entry, score: propertyTokens.filter((token) => entry.text.includes(token)).length }))
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ROWS)
      .map((entry) => ({
        well: entry.well,
        suggested: propertyTokens.length > 0 && entry.score === propertyTokens.length,
      }));
  }, [indexed, query, propertyDescription]);

  const optionId = (index: number) => `${listId}-opt-${index}`;

  if (disabled) {
    return linked ? (
      <Badge variant="outline" className={cn("text-xs font-medium", theme.okBadge)}>
        Linked to well {wellLabel ?? wellId}
      </Badge>
    ) : (
      <Badge variant="outline" className={cn("text-xs font-medium", theme.warnBadge)}>
        Not linked to a well
      </Badge>
    );
  }

  const pick = (well: WellOption | null) => {
    onLink(well ? { id: well.id, label: well.label } : null);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(Math.min(i + 1, rows.length - 1), 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (rows[activeIndex]) pick(rows[activeIndex].well);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setQuery("");
          setActiveIndex(0);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        {linked ? (
          <button
            type="button"
            title="Change the linked well"
            className={cn(
              "inline-flex h-[22px] cursor-pointer items-center gap-1 rounded-md border px-2 text-xs font-medium",
              theme.okBadge,
            )}
          >
            Linked to well {wellLabel ?? wellId}
            <ChevronDown className="size-3" />
          </button>
        ) : (
          <button
            type="button"
            className={cn(
              "inline-flex h-[26px] cursor-pointer items-center gap-1.5 rounded-md border-[1.5px] border-dashed px-2 text-xs font-medium",
              theme.dashedLink,
            )}
          >
            <Link2 className="size-3.5" />
            Link to a well
            <ChevronDown className="size-3" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        aria-label="Choose a well"
        align="start"
        collisionPadding={8}
        style={{ zIndex: Z_INDEX.modalDropdown }}
        className={cn("flex w-[26rem] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0", theme.popoverText)}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          searchRef.current?.querySelector("input")?.focus({ preventScroll: true });
        }}
      >
        <div ref={searchRef} className="relative p-2">
          <Search
            className={cn(
              "pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2",
              theme.isLight ? "text-gray-400" : "text-purple-300/60",
            )}
          />
          <Input
            aria-label="Search wells"
            role="combobox"
            aria-expanded
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={rows[activeIndex] ? optionId(activeIndex) : undefined}
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search well name, lease, API number…"
            className={cn(
              "h-9 pl-9",
              theme.isLight
                ? "bg-white border-purple-200 text-gray-900 placeholder:text-gray-400"
                : "bg-white/5 border-purple-300/30 text-white placeholder:text-purple-300/40",
            )}
          />
        </div>
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching wells"
          className={cn("max-h-72 overflow-y-auto border-t p-1.5", theme.popoverDivider)}
        >
          {loading ? (
            <li className={cn("px-3 py-4 text-center text-sm", theme.popoverMuted)}>Loading wells…</li>
          ) : rows.length === 0 ? (
            <li className={cn("px-3 py-4 text-center text-sm", theme.popoverMuted)}>
              {wells.length ? `No wells match “${query.trim()}”` : "No wells yet"}
            </li>
          ) : (
            rows.map(({ well, suggested }, index) => {
              const selected = well.id === wellId;
              return (
                <li
                  key={well.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseMove={() => {
                    if (index !== activeIndex) setActiveIndex(index);
                  }}
                  onClick={() => pick(well)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2",
                    index === activeIndex && theme.optionActive,
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{well.label}</span>
                    <span className={cn("block truncate text-xs", theme.popoverMuted)}>{wellDetails(well)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {suggested && (
                      <Badge variant="outline" className={cn("text-[10px] font-medium", theme.okBadge)}>
                        Matches property
                      </Badge>
                    )}
                    {selected && <Check className="size-4" role="img" aria-label="Linked" />}
                  </span>
                </li>
              );
            })
          )}
        </ul>
        {linked && (
          <div className={cn("flex justify-end border-t px-2 py-1.5", theme.popoverDivider)}>
            <button
              type="button"
              onClick={() => pick(null)}
              className={cn(
                "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                theme.isLight ? "text-red-700 hover:bg-red-50" : "text-red-300 hover:bg-red-500/20",
              )}
            >
              <Unlink className="size-3.5" />
              Unlink {wellLabel ?? "well"}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default WellLinkPicker;
