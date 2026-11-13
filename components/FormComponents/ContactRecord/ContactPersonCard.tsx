import React from "react";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalHeader } from "../../modals/Modal";
import type { Contact } from "../ContactsTab";
import type { ContactPerson } from "@/hooks/useContacts";
import { SECTION_HEADER } from "./utils";

interface ContactPersonCardProps {
  contacts: ContactPerson[];
  /** False until the contact is saved — internal contacts need a party to hang off. */
  canManage: boolean;
  onManage: () => void;
  onUpdateContact?: (id: number, contact: Omit<Contact, "id">) => Promise<void>;
  isLight: boolean;
}

const fullName = (c: Contact) => [c.nameFirst, c.nameMiddle, c.nameLast].filter(Boolean).join(" ");

const formatAddress = (c: Contact) => {
  const cityLine = [c.city, [c.state, c.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [c.address, c.addressLine2, cityLine].filter(Boolean).join(", ");
};

const EDIT_FIELDS: { key: keyof Contact; label: string; type?: string; required?: boolean }[] = [
  { key: "nameFirst", label: "First Name", required: true },
  { key: "nameMiddle", label: "Middle Name" },
  { key: "nameLast", label: "Last Name" },
  { key: "role", label: "Role / Relationship" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
];

export const ContactPersonCard = ({
  contacts,
  canManage,
  onManage,
  onUpdateContact,
  isLight,
}: ContactPersonCardProps) => {
  const primary = contacts.find((c) => c._isPrimary) ?? contacts[0];
  const [editing, setEditing] = React.useState<Record<string, string> | null>(null);
  const [saving, setSaving] = React.useState(false);
  const idPrefix = React.useId();

  const startEdit = () => {
    if (!primary) return;
    setEditing(
      EDIT_FIELDS.reduce<Record<string, string>>((acc, f) => {
        acc[f.key] = String(primary[f.key] ?? "");
        return acc;
      }, {}),
    );
  };

  const save = async () => {
    if (!primary || !editing || !onUpdateContact || !editing.nameFirst.trim()) return;
    setSaving(true);
    try {
      const { id, ...rest } = primary;
      await onUpdateContact(id, { ...rest, ...editing });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const details = primary
    ? [formatAddress(primary) && `Address: ${formatAddress(primary)}`, primary.phone, primary.email].filter(Boolean)
    : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className={SECTION_HEADER}>Contact Person</h3>
        {canManage && (
          <button
            type="button"
            onClick={onManage}
            className="text-xs text-purple-300 hover:text-purple-100 hover:underline cursor-pointer"
          >
            Manage all contact people in the Internal Contacts tab
          </button>
        )}
      </div>

      {primary ? (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-white/5 border border-purple-300/20 px-3.5 py-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="font-semibold text-white">{fullName(primary)}</strong>
              {primary.role && (
                <span className="inline-flex h-[22px] items-center rounded-md px-2 text-xs font-medium bg-purple-500/20 text-purple-200">
                  {primary.role}
                </span>
              )}
            </div>
            {details.length > 0 && <p className="text-xs text-white/70">{details.join(" · ")}</p>}
          </div>
          {onUpdateContact && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={startEdit}
              className="h-8 border border-purple-300/30 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
            >
              Edit
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-purple-300/30 px-3.5 py-3 text-sm text-white/70">
          {canManage ? (
            <>
              No contact person yet.{" "}
              <button
                type="button"
                onClick={onManage}
                className="text-purple-300 hover:text-purple-100 hover:underline cursor-pointer"
              >
                Add one in the Internal Contacts tab
              </button>
            </>
          ) : (
            "Save this contact first to add a contact person."
          )}
        </div>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} portal isLight={isLight} maxWidthClassName="max-w-lg">
          <ModalHeader
            title="Edit Contact Person"
            icon={<User className={`w-5 h-5 ${isLight ? "text-purple-600" : "text-purple-300"}`} />}
            onClose={() => setEditing(null)}
            isLight={isLight}
          />
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {EDIT_FIELDS.map((f) => (
                <div key={f.key}>
                  <Label htmlFor={`${idPrefix}-${f.key}`} className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
                    {f.label}
                    {f.required && <span className="text-red-500 text-sm font-bold">*</span>}
                  </Label>
                  <Input
                    id={`${idPrefix}-${f.key}`}
                    type={f.type ?? "text"}
                    value={editing[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [f.key]: e.target.value })}
                    className="bg-white/5 border-purple-300/30 text-white h-9"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-white/70">Address and other contact people are managed on the Internal Contacts tab.</p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
                className="border border-purple-300/30 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saving || !editing.nameFirst.trim()}
                onClick={save}
                className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
              >
                {saving ? "Saving..." : "Save Contact Person"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ContactPersonCard;
