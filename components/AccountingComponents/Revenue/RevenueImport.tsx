import type { FC } from "react";

export interface RevenueImportProps {
  onCancel: () => void;
  onDone: (checkId?: string) => void;
}

export const RevenueImport: FC<RevenueImportProps> = () => (
  <div className="text-white/70">Check detail import coming soon.</div>
);

export default RevenueImport;
