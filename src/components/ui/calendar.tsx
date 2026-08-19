"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, DayFlag, SelectionState, UI } from "react-day-picker";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Color is intentionally NOT expressed as Tailwind utility classes here (e.g. text-white,
// bg-purple-600) — this popover portals to <body> like Radix Select does, so it renders outside
// the `.light-theme` wrapper div and those utilities would never pick up the light-theme
// overrides. Instead each piece gets a stable `cal-*` hook and the actual colors live in
// index.css under `[data-slot="popover-content"] .cal-*`, themed the same way select-content is.
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0", className)}
      classNames={{
        [UI.Months]: "flex flex-col",
        [UI.Month]: "space-y-3",
        [UI.MonthCaption]: "flex justify-center items-center h-8 relative",
        [UI.CaptionLabel]: "cal-caption text-sm font-semibold",
        [UI.Nav]: "flex items-center justify-between absolute inset-x-0 top-0 h-8",
        [UI.PreviousMonthButton]:
          "cal-nav-btn size-7 flex items-center justify-center rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none",
        [UI.NextMonthButton]:
          "cal-nav-btn size-7 flex items-center justify-center rounded-md transition-colors cursor-pointer disabled:opacity-30 disabled:pointer-events-none",
        [UI.MonthGrid]: "w-full border-collapse",
        [UI.Weekdays]: "flex",
        [UI.Weekday]:
          "cal-weekday w-9 h-8 text-xs font-medium flex items-center justify-center",
        [UI.Week]: "flex w-full",
        [UI.Day]: "size-9 p-0 text-center",
        [UI.DayButton]:
          "cal-day-btn size-9 rounded-md text-sm transition-colors cursor-pointer flex items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-purple-400",
        [DayFlag.today]: "cal-day-today",
        [DayFlag.outside]: "cal-day-outside",
        [DayFlag.disabled]: "cal-day-disabled",
        [DayFlag.hidden]: "invisible",
        [SelectionState.selected]: "cal-day-selected",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === "left" ? (
            <ChevronLeft className="size-4" {...chevronProps} />
          ) : (
            <ChevronRight className="size-4" {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
