import { Clock } from "lucide-react";
import { formatTimestamp } from "./utils";

interface ContactAuditLineProps {
  createdBy: string | null;
  createdAt?: string | null;
  updatedBy: string | null;
  updatedAt?: string | null;
}

const part = (verb: string, by: string | null, at?: string | null) => {
  const when = formatTimestamp(at);
  if (!by && !when) return null;
  return (
    <span key={verb}>
      {verb}
      {by && (
        <>
          {" by "}
          <strong className="font-semibold text-white">{by}</strong>
        </>
      )}
      {when && ` · ${when}`}
    </span>
  );
};

export const ContactAuditLine = ({ createdBy, createdAt, updatedBy, updatedAt }: ContactAuditLineProps) => {
  const parts = [part("Created", createdBy, createdAt), part("Updated", updatedBy, updatedAt)].filter(Boolean);
  if (parts.length === 0) return null;
  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-white/70">
      <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      {parts.map((p, i) => (
        <span key={i} className="contents">
          {i > 0 && <span aria-hidden="true">·</span>}
          {p}
        </span>
      ))}
    </p>
  );
};

export default ContactAuditLine;
