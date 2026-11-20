import { useMutation } from "@tanstack/react-query";
import type { DocumentKind, DocumentReadResultFor } from "@/types/documentReader";

export const READABLE_DOCUMENT_ACCEPT = "application/pdf,.pdf,image/*";

export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || /\.pdf$/i.test(file.name);

export const isImageFile = (file: File) =>
  file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|tiff?|heic)$/i.test(file.name);

export const isReadableDocument = (file: File) => isPdfFile(file) || isImageFile(file);

const MOCK_READ_DELAY_MS = 1000;

const MOCK_RESULTS: { [K in DocumentKind]: DocumentReadResultFor<K> } = {
  invoice: {
    kind: "invoice",
    fields: {
      vendorName: "Permian Basin Water Services LLC",
      invoiceNumber: "88213",
      invoiceAmount: 12480,
      invoiceDate: "2026-11-04",
      serviceDate: "2026-10-31",
    },
    confidence: {
      vendorName: 0.97,
      invoiceNumber: 0.99,
      invoiceAmount: 0.98,
      invoiceDate: 0.95,
      serviceDate: 0.86,
    },
  },
  checkStub: {
    kind: "checkStub",
    fields: {
      operatorName: "SMITH OPERATING CO",
      ownerName: "JOHN DOE",
      ownerNumber: "123456",
      checkNumber: "987654",
      checkDate: "2026-10-27",
      checkAmount: 500,
    },
    confidence: {
      operatorName: 0.96,
      ownerName: 0.94,
      ownerNumber: 0.9,
      checkNumber: 0.99,
      checkDate: 0.97,
      checkAmount: 0.99,
    },
  },
};

// Mocked: no BE reader yet — the real version uploads the file and returns extracted fields.
const requestDocumentRead = async <K extends DocumentKind>(
  kind: K,
  file: File
): Promise<DocumentReadResultFor<K>> => {
  if (!isReadableDocument(file)) {
    throw new Error("Only PDF or image files can be read.");
  }
  await new Promise((resolve) => setTimeout(resolve, MOCK_READ_DELAY_MS));
  return structuredClone(MOCK_RESULTS[kind]);
};

export interface UseDocumentReaderResult<K extends DocumentKind> {
  /** Rejects on failure; the message is also exposed as `error`. */
  readDocument: (file: File) => Promise<DocumentReadResultFor<K>>;
  isReading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useDocumentReader = <K extends DocumentKind>(kind: K): UseDocumentReaderResult<K> => {
  const mutation = useMutation<DocumentReadResultFor<K>, Error, File>({
    mutationFn: (file) => requestDocumentRead(kind, file),
  });

  return {
    readDocument: mutation.mutateAsync,
    isReading: mutation.isPending,
    error: mutation.error ? mutation.error.message || "Couldn't read this document." : null,
    clearError: mutation.reset,
  };
};
