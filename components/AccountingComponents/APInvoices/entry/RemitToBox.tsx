import Link from "next/link";
import { useAtomValue } from "jotai";
import { themeAtom } from "@/atoms/NavigationAtom";
import { cn } from "@/lib/utils";

interface RemitToBoxProps {
  vendorName: string;
  hasVendor: boolean;
  /** Address lines under the vendor name. */
  lines: string[];
  /** e.g. "Payment"; shown in the heading. */
  addressType: string | null;
  /** Shown in yellow, e.g. when the vendor has no address of its remit-to type. */
  warning?: string | null;
  loading?: boolean;
  /** The address lookup failed. */
  error?: boolean;
  readOnly?: boolean;
  className?: string;
}

export const RemitToBox = ({
  vendorName,
  hasVendor,
  lines,
  addressType,
  warning,
  loading,
  error,
  readOnly,
  className,
}: RemitToBoxProps) => {
  const isLight = useAtomValue(themeAtom) === "light";
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border border-purple-300/20 bg-white/5 px-3 py-2.5",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-purple-200">
          Remit to{addressType ? ` · ${addressType} address` : ""}
        </div>
        {!hasVendor ? (
          <p className="mt-1 text-sm text-white/50">Pick a vendor to see where the check goes.</p>
        ) : loading ? (
          <p className="mt-1 text-sm text-white/50">Loading address…</p>
        ) : error ? (
          <p role="alert" className={cn("mt-1 text-sm", isLight ? "text-red-700" : "text-red-300")}>
            Couldn&apos;t load this vendor&apos;s address. Check your connection, then refocus this window to retry.
          </p>
        ) : (
          <div className="mt-1 text-sm text-white">
            <div>{vendorName}</div>
            {lines.length ? (
              lines.map((line, i) => <div key={i}>{line}</div>)
            ) : (
              <div className="text-white/50">No address on file</div>
            )}
          </div>
        )}
        {warning && hasVendor && !loading && !error && (
          <p className={cn("mt-1 text-xs", isLight ? "text-yellow-700" : "text-yellow-300")}>{warning}</p>
        )}
      </div>
      {!readOnly && (
        <Link
          href="/Dashboard/contacts"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 whitespace-nowrap text-xs text-purple-300 underline-offset-2 hover:text-purple-100 hover:underline"
        >
          Wrong address? Edit vendor
        </Link>
      )}
    </div>
  );
};

export default RemitToBox;
