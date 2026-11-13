import { createContext, useContext, useEffect, useId } from "react";

/** Lets inputs holding text they couldn't read tell the form, so Save and Post can refuse. */
export type ReportUnreadable = (key: string, label: string | null) => void;

export const UnreadableFieldsContext = createContext<ReportUnreadable>(() => undefined);

export const useReportUnreadable = (active: boolean, label: string | undefined) => {
  const report = useContext(UnreadableFieldsContext);
  const key = useId();
  useEffect(() => {
    if (!active) return;
    report(key, label ?? "A field");
    return () => report(key, null);
  }, [active, label, report, key]);
};
