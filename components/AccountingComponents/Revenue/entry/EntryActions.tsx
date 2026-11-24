import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  CopyPlus,
  ExternalLink,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEntryTheme } from "./entryTheme";

export type EntryBusy = "save" | "post" | "delete" | null;

interface EntryActionsProps {
  readOnly: boolean;
  /** A saved draft can be deleted; a new, posted or void check can't. */
  canDelete: boolean;
  busy: EntryBusy;
  /** From postBlockers; Post Check stays disabled while there are any. */
  blockers: string[];
  onCancel: () => void;
  onSave: () => void;
  onPost: () => void;
  onDelete: () => void;
  /** Shows Void Check; only a posted check can be voided. */
  onVoid?: () => void;
  /** Shows Re-enter as new draft, for a void check. */
  onReenter?: () => void;
  /** Shows Open re-entry, for a void check that was already re-entered. */
  onOpenReentry?: () => void;
}

const useDebounced = <T,>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

/** Cancel / Save Draft / Post Check, with what still stands in the way of posting. */
export const EntryActions = ({
  readOnly,
  canDelete,
  busy,
  blockers,
  onCancel,
  onSave,
  onPost,
  onDelete,
  onVoid,
  onReenter,
  onOpenReentry,
}: EntryActionsProps) => {
  const theme = useEntryTheme();
  const announcedCount = useDebounced(blockers.length, 1000);

  if (readOnly) {
    return (
      <div className="flex flex-wrap justify-end gap-2 border-t border-purple-300/30 pt-3">
        {onVoid && (
          <Button
            type="button"
            variant="outline"
            onClick={onVoid}
            className={cn("cursor-pointer", theme.dangerButton)}
          >
            <Ban className="size-4" />
            Void Check
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className={cn("cursor-pointer", theme.outlineButton)}
        >
          Back to Revenue Checks
        </Button>
        {onReenter && (
          <Button
            type="button"
            onClick={onReenter}
            className="bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
          >
            <CopyPlus className="size-4" />
            Re-enter as new draft
          </Button>
        )}
        {onOpenReentry && (
          <Button
            type="button"
            onClick={onOpenReentry}
            className="bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
          >
            <ExternalLink className="size-4" />
            Open re-entry
          </Button>
        )}
      </div>
    );
  }

  const spinner = <Loader2 className="size-4 animate-spin" />;

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="sr-only">
        {announcedCount > 0
          ? `${announcedCount} ${announcedCount === 1 ? "thing" : "things"} to fix before this check can post.`
          : "Nothing is stopping this check from posting."}
      </p>
      {blockers.length > 0 && (
        <div className="flex justify-end">
          <div
            id="rc-post-blockers"
            className={cn(
              "w-full max-w-xl rounded-lg border px-3 py-2.5 text-xs",
              theme.warnBox,
            )}
          >
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              <AlertTriangle className="size-3.5 shrink-0" />
              Before this check can post
            </p>
            <ul className="list-disc space-y-0.5 pl-5">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-purple-300/30 pt-3">
        <span className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className={cn("cursor-pointer", theme.ghostButton)}
          >
            Cancel
          </Button>
          <span className="text-xs text-white/60">
            Posting needs a balanced check, every property linked and every tax
            / deduct label mapped.
          </span>
        </span>
        <div className="flex flex-wrap gap-2">
          {canDelete && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy !== null}
              onClick={onDelete}
              className={cn("cursor-pointer", theme.dangerIconButton)}
            >
              {busy === "delete" ? spinner : <Trash2 className="size-4" />}
              Delete
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null}
            onClick={onSave}
            className={cn("cursor-pointer", theme.outlineButton)}
          >
            {busy === "save" && spinner}
            Save Draft
          </Button>
          <Button
            type="button"
            disabled={busy !== null || blockers.length > 0}
            aria-describedby={blockers.length ? "rc-post-blockers" : undefined}
            onClick={onPost}
            className="bg-purple-600 text-white hover:bg-purple-700 cursor-pointer"
          >
            {busy === "post" && spinner}
            Post Check
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EntryActions;
