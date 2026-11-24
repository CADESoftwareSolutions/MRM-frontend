export type DocumentKind = "invoice" | "checkStub";

/** Dates are ISO "YYYY-MM-DD"; amounts are plain numbers (12480 = $12,480.00). */
export interface ExtractedInvoiceFields {
  vendorName?: string;
  invoiceNumber?: string;
  invoiceAmount?: number;
  invoiceDate?: string;
  dueDate?: string;
  serviceDate?: string;
}

/** Dates are ISO "YYYY-MM-DD"; amounts are plain numbers. */
export interface ExtractedCheckStubFields {
  operatorName?: string;
  ownerName?: string;
  ownerNumber?: string;
  checkNumber?: string;
  checkDate?: string;
  checkAmount?: number;
}

/** confidence is keyed by field name, 0–1. */
export type DocumentReadResult =
  | { kind: "invoice"; fields: ExtractedInvoiceFields; confidence?: Record<string, number> }
  | { kind: "checkStub"; fields: ExtractedCheckStubFields; confidence?: Record<string, number> };

export type DocumentReadResultFor<K extends DocumentKind> = Extract<DocumentReadResult, { kind: K }>;
