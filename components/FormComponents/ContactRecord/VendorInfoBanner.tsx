import { AlertCircle } from "lucide-react";

export const VendorInfoBanner = ({ isLight }: { isLight: boolean }) => (
  <div
    role="note"
    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
      isLight ? "bg-blue-50 border-blue-300 text-blue-900" : "bg-blue-500/10 border-blue-300/30 text-blue-200"
    }`}
  >
    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
    <span>
      This tab only appears for contacts with the VENDOR classification. Its settings pre-fill every new invoice for
      this vendor.
    </span>
  </div>
);

export default VendorInfoBanner;
