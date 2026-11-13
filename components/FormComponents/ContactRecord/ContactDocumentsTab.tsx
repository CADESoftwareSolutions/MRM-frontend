import React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { FileText, Link2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToastAtom } from "@/atoms/toastAtom";
import { ATTACH_FILE_MUTATION, FETCH_FILE_ATTACHMENTS } from "@/graphql/Files";
import { FileAttachmentEntry, useFileUpload } from "@/hooks/useFileUpload";
import { executeGraphQL } from "@/lib/api";
import { Modal, ModalHeader } from "../../modals/Modal";
import { LeaseAttachmentsTab } from "../LeaseAttachmentsTab";
import { SECTION_HEADER, formatDate } from "./utils";

interface ContactDocumentsTabProps {
  /** null before the contact is saved — the files API needs an existing party to attach to. */
  partyId: number | null;
  isLight: boolean;
}

const formatBytes = (bytes: number | null) => {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface AttachmentRow {
  id: string | number;
  label?: string | null;
  documentKind?: string | null;
  createdAt: string;
  storedFile?: {
    id: string | number;
    originalFilename?: string;
    byteSize?: number | null;
    contentType?: string | null;
    status?: string;
  } | null;
}

const toEntry = (row: AttachmentRow): FileAttachmentEntry => ({
  id: String(row.id),
  label: row.label ?? null,
  documentKind: row.documentKind ?? null,
  createdAt: row.createdAt,
  fileId: Number(row.storedFile?.id),
  originalFilename: row.storedFile?.originalFilename || "",
  byteSize: row.storedFile?.byteSize ?? null,
  contentType: row.storedFile?.contentType ?? null,
  status: row.storedFile?.status || "",
});

interface LinkDocumentModalProps {
  partyId: number;
  alreadyLinked: Set<number>;
  isLight: boolean;
  onClose: () => void;
}

// Linking re-attaches a file already uploaded to another record (lease, deed, well, contact), so
// the same stored file shows on both without a second upload.
const LinkDocumentModal = ({ partyId, alreadyLinked, isLight, onClose }: LinkDocumentModalProps) => {
  const queryClient = useQueryClient();
  const showToast = useSetAtom(showToastAtom);
  const [search, setSearch] = React.useState("");
  const [linkingId, setLinkingId] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ["fileAttachments", "__account__"],
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_FILE_ATTACHMENTS, {});
      const seen = new Set<number>();
      return ((result.fileAttachments || []) as AttachmentRow[]).map(toEntry).filter((entry) => {
        if (seen.has(entry.fileId)) return false;
        seen.add(entry.fileId);
        return true;
      });
    },
  });

  const term = search.trim().toLowerCase();
  const candidates = data.filter(
    (entry) =>
      !alreadyLinked.has(entry.fileId) &&
      (!term ||
        entry.originalFilename.toLowerCase().includes(term) ||
        (entry.label ?? "").toLowerCase().includes(term) ||
        (entry.documentKind ?? "").toLowerCase().includes(term)),
  );

  const link = async (entry: FileAttachmentEntry) => {
    setLinkingId(entry.fileId);
    setError(null);
    try {
      await executeGraphQL(ATTACH_FILE_MUTATION, {
        fileId: entry.fileId,
        entityType: "party",
        entityId: partyId,
        label: entry.label,
        documentKind: entry.documentKind,
      });
      await queryClient.invalidateQueries({ queryKey: ["fileAttachments"] });
      showToast(`Linked ${entry.originalFilename}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Modal onClose={onClose} portal isLight={isLight} maxWidthClassName="max-w-xl">
      <ModalHeader
        title="Link Existing Document"
        icon={<Link2 className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
        onClose={onClose}
        isLight={isLight}
      />
      <div className="p-6 space-y-3">
        <p className="text-sm text-white/70">
          Pick a document already uploaded to another record. It stays on that record too.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" aria-hidden="true" />
          <Input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by file name or label"
            className="pl-9 bg-white/5 border-purple-300/30 text-white h-9"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <p className="py-4 text-center text-xs text-white/50">Loading documents…</p>
          ) : candidates.length === 0 ? (
            <p className="py-4 text-center text-xs text-white/50">
              {term ? "No documents match that search." : "No other documents to link yet."}
            </p>
          ) : (
            candidates.map((entry) => (
              <div
                key={entry.fileId}
                className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-purple-300/20"
              >
                <FileText className="w-5 h-5 shrink-0 text-purple-300" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white truncate">{entry.label || entry.originalFilename}</p>
                  <p className="text-xs text-white/50 truncate">
                    {[entry.label ? entry.originalFilename : null, formatBytes(entry.byteSize), formatDate(entry.createdAt)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={linkingId !== null}
                  onClick={() => link(entry)}
                  className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
                >
                  {linkingId === entry.fileId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link"}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
};

export const ContactDocumentsTab = ({ partyId, isLight }: ContactDocumentsTabProps) => {
  const [linking, setLinking] = React.useState(false);
  const { attachments } = useFileUpload({ entityType: "party", entityId: partyId });
  const alreadyLinked = React.useMemo(() => new Set(attachments.map((a) => a.fileId)), [attachments]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className={SECTION_HEADER}>Documents</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={partyId == null}
          onClick={() => setLinking(true)}
          className="border border-purple-300/30 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
        >
          <Link2 className="w-4 h-4" />
          Link existing document
        </Button>
      </div>
      <p className="form-help-text text-xs">
        W-9s, letters, probate and transfer papers for this contact. Click a document to open it.
      </p>
      <LeaseAttachmentsTab entityType="party" entityId={partyId} />
      {linking && partyId != null && (
        <LinkDocumentModal
          partyId={partyId}
          alreadyLinked={alreadyLinked}
          isLight={isLight}
          onClose={() => setLinking(false)}
        />
      )}
    </div>
  );
};

export default ContactDocumentsTab;
