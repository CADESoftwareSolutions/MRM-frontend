import type { FC } from "react";

export interface InvoiceEntryProps {
  invoiceId: string | null;
  onBack: () => void;
  onOpenInvoice: (id: string) => void;
  onNewInvoice: () => void;
}

export const InvoiceEntry: FC<InvoiceEntryProps> = () => (
  <div className="text-white/70">Invoice entry coming soon.</div>
);

export default InvoiceEntry;
