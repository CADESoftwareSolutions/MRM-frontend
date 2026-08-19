import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, executeGraphQL } from "../lib/api";
import {
  FETCH_FILE_ATTACHMENTS,
  ATTACH_FILE_MUTATION,
  DETACH_FILE_MUTATION,
} from "../graphql/Files";

// Matches files_api.py ENTITY_MODELS / graphql_file_mutations.py ENTITY_MODELS
export type FileEntityType = "lease" | "title_document" | "party" | "well";

export interface FileAttachmentEntry {
  id: string;
  label: string | null;
  documentKind: string | null;
  createdAt: string;
  fileId: number;
  originalFilename: string;
  byteSize: number | null;
  contentType: string | null;
  status: string;
}

interface UseFileUploadProps {
  entityType: FileEntityType;
  entityId?: number | null;
}

// REST responses from files_api.py are plain Flask jsonify() — snake_case, unlike the
// GraphQL layer which graphene auto-converts to camelCase.
const restFetch = async (path: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
};

// Fetch refuses to let callers set these — the browser sets them itself from the request
// it's actually making, so passing the backend's declared values through would either be
// silently dropped or throw depending on runtime.
const UNSAFE_UPLOAD_HEADERS = new Set(["content-length", "host", "connection"]);

const transformAttachment = (row: any): FileAttachmentEntry => ({
  id: String(row.id),
  label: row.label ?? null,
  documentKind: row.documentKind ?? null,
  createdAt: row.createdAt,
  fileId: row.storedFile?.id,
  originalFilename: row.storedFile?.originalFilename || "",
  byteSize: row.storedFile?.byteSize ?? null,
  contentType: row.storedFile?.contentType ?? null,
  status: row.storedFile?.status || "",
});

export const useFileUpload = ({ entityType, entityId }: UseFileUploadProps) => {
  const queryClient = useQueryClient();
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const queryKey = ["fileAttachments", entityType, entityId];

  const { data: attachments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await executeGraphQL(FETCH_FILE_ATTACHMENTS, { entityType, entityId });
      return (result.fileAttachments || []).map(transformAttachment) as FileAttachmentEntry[];
    },
    enabled: entityId != null,
  });

  const uploadFile = useCallback(
    async (file: File, opts: { label?: string; documentKind?: string } = {}) => {
      if (entityId == null) {
        throw new Error("Save the record before attaching documents");
      }
      setUploadingCount((c) => c + 1);
      setUploadError(null);
      try {
        const target = await restFetch("/files/upload-target", {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            content_type: file.type || "application/octet-stream",
            byte_size: file.size,
            purpose: "attachment",
            entity_type: entityType,
            entity_id: entityId,
          }),
        });

        const uploadHeaders: Record<string, string> = Object.fromEntries(
          Object.entries(target.headers || {}).filter(
            ([key]) => !UNSAFE_UPLOAD_HEADERS.has(key.toLowerCase()),
          ),
        ) as Record<string, string>;
        // Local storage targets loop back through this Flask app and need the session
        // cookie; S3 presigned URLs are a different origin and must not carry it.
        const isSameOrigin = String(target.upload_url).startsWith(API_URL);
        const putResponse = await fetch(target.upload_url, {
          method: target.method || "PUT",
          headers: uploadHeaders,
          body: file,
          credentials: isSameOrigin ? "include" : "omit",
        });
        if (!putResponse.ok) {
          throw new Error(`Upload failed (${putResponse.status})`);
        }

        await restFetch(`/files/${target.file_id}/complete`, { method: "POST" });

        const result = await executeGraphQL(ATTACH_FILE_MUTATION, {
          fileId: target.file_id,
          entityType,
          entityId,
          label: opts.label || null,
          documentKind: opts.documentKind || null,
        });

        await queryClient.invalidateQueries({ queryKey });
        return transformAttachment(result.attachFile.fileAttachment);
      } catch (err) {
        setUploadError((err as Error).message);
        throw err;
      } finally {
        setUploadingCount((c) => c - 1);
      }
    },
    [entityType, entityId, queryClient],
  );

  const detachFile = useCallback(
    async (attachmentId: string) => {
      await executeGraphQL(DETACH_FILE_MUTATION, { attachmentId: Number(attachmentId) });
      await queryClient.invalidateQueries({ queryKey });
    },
    [queryClient, entityType, entityId],
  );

  const getDownloadUrl = useCallback(async (fileId: number) => {
    const result = await restFetch(`/files/${fileId}/download-url`, { method: "GET" });
    return result.download_url as string;
  }, []);

  return {
    attachments,
    loading: isLoading,
    uploading: uploadingCount > 0,
    uploadError,
    clearUploadError: () => setUploadError(null),
    uploadFile,
    detachFile,
    getDownloadUrl,
  };
};

export default useFileUpload;
