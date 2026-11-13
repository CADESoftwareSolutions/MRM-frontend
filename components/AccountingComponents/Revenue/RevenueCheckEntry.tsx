import type { FC } from "react";

export interface RevenueCheckEntryProps {
  checkId: string | null;
  onBack: () => void;
  onImport: () => void;
  onOpenCheck?: (id: string) => void;
}

export const RevenueCheckEntry: FC<RevenueCheckEntryProps> = () => (
  <div className="text-white/70">Revenue check entry coming soon.</div>
);

export default RevenueCheckEntry;
