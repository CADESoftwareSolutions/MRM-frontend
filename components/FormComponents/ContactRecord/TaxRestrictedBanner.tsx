import { Lock } from "lucide-react";

export const TaxRestrictedBanner = ({ isLight }: { isLight: boolean }) => (
  <div
    role="note"
    className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm ${
      isLight ? "bg-purple-50 border-purple-300 text-purple-900" : "bg-purple-600/15 border-purple-300/35 text-purple-50"
    }`}
  >
    <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
    <span>Restricted. Only users with Tax access see the full Tax ID, and every view or change is logged.</span>
  </div>
);

export default TaxRestrictedBanner;
