import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, Trash2, Plus, User, X, Save } from "lucide-react";
import { STATES } from "@/config/directoryConfig";

export interface Contact {
  id: number;
  _relatedPartyId?: number;
  _phoneId?: number;
  _addressId?: number;
  nameFirst: string;
  nameMiddle?: string;
  nameLast: string;
  role?: string;
  phone?: string;
  email?: string;
  addressType?: string[];
  address?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface ContactsTabProps {
  partyId?: number;
  contacts: Contact[];
  onAdd: (contact: Omit<Contact, "id">) => Promise<void>;
  onUpdate: (id: number, contact: Omit<Contact, "id">) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const ADDRESS_TYPES = ["Physical", "Mailing", "Correspondence"];

const emptyForm = {
  nameFirst: "",
  nameMiddle: "",
  nameLast: "",
  role: "",
  phone: "",
  email: "",
  addressType: [] as string[],
  address: "",
  addressLine2: "",
  city: "",
  state: "",
  zip: "",
};

export const ContactsTab: React.FC<ContactsTabProps> = ({
  partyId,
  contacts,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  if (!partyId) {
    return (
      <div className="flex items-center justify-center py-16 text-purple-300/70 text-sm">
        Save this record first to add an internal contact.
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!form.nameFirst.trim()) return;
    setSaving(true);
    try {
      if (editingId !== null) {
        await onUpdate(editingId, form);
      } else {
        await onAdd(form);
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      nameFirst: contact.nameFirst,
      nameMiddle: contact.nameMiddle || "",
      nameLast: contact.nameLast,
      role: contact.role || "",
      phone: contact.phone || "",
      email: contact.email || "",
      addressType: contact.addressType || [],
      address: contact.address || "",
      addressLine2: contact.addressLine2 || "",
      city: contact.city || "",
      state: contact.state || "",
      zip: contact.zip || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setShowForm(false);
    setEditingId(null);
  };

  const commonInput = "bg-white/5 border-purple-300/30 text-white h-9";

  return (
    <div className="space-y-3">
      {contacts.length === 0 && !showForm && (
        <div className="text-center py-10 text-purple-300/70 text-sm">
          No internal contacts added yet.
        </div>
      )}

      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-purple-300/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-purple-300" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                {[contact.nameFirst, contact.nameMiddle, contact.nameLast]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              {contact.role && (
                <p className="text-purple-300 text-xs mt-0.5">{contact.role}</p>
              )}
              {(contact.phone || contact.email) && (
                <p className="text-purple-300 text-xs mt-0.5">
                  {[contact.phone, contact.email].filter(Boolean).join(" · ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => startEdit(contact)}
              className="px-2 text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(contact.id)}
              className="px-2 text-red-300 hover:text-red-100 hover:bg-red-500/20 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {showForm && (
        <div className="p-4 rounded-lg border border-purple-300/30 bg-white/5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                First Name{" "}
                <span className="text-red-500 text-sm font-bold">*</span>
              </Label>
              <Input
                value={form.nameFirst}
                onChange={(e) =>
                  setForm({ ...form, nameFirst: e.target.value })
                }
                placeholder="First name"
                className={commonInput}
              />
            </div>
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                Middle Name
              </Label>
              <Input
                value={form.nameMiddle}
                onChange={(e) =>
                  setForm({ ...form, nameMiddle: e.target.value })
                }
                placeholder="Middle name"
                className={commonInput}
              />
            </div>
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                Last Name{" "}
                <span className="text-red-500 text-sm font-bold">*</span>
              </Label>
              <Input
                value={form.nameLast}
                onChange={(e) => setForm({ ...form, nameLast: e.target.value })}
                placeholder="Last name"
                className={commonInput}
              />
            </div>
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                Role / Department
              </Label>
              <Input
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                placeholder="e.g. Accounting, Land Manager"
                className={commonInput}
              />
            </div>

            {/* Phone & Email */}
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                Phone
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                type="tel"
                className={commonInput}
              />
            </div>
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                Email
              </Label>
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
                type="email"
                className={commonInput}
              />
            </div>

            {/* Address Type */}
            <div className="col-span-2">
              <Label className="text-white font-semibold text-sm mb-2 block">
                Address Type
              </Label>
              <div className="flex flex-wrap gap-2">
                {ADDRESS_TYPES.map((type) => {
                  const selected = form.addressType.includes(type);
                  return (
                    <Badge
                      key={type}
                      onClick={() => {
                        const next = selected
                          ? form.addressType.filter((t) => t !== type)
                          : [...form.addressType, type];
                        setForm({ ...form, addressType: next });
                      }}
                      className={`cursor-pointer transition-all ${
                        selected
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-white/10 text-purple-200 hover:bg-white/20"
                      }`}
                    >
                      {type}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Address */}
            <div className="col-span-2">
              <Label className="text-white font-semibold text-sm mb-2 block">
                Address
              </Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Street address"
                className={commonInput}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-white font-semibold text-sm mb-2 block">
                Address Line 2
              </Label>
              <Input
                value={form.addressLine2}
                onChange={(e) =>
                  setForm({ ...form, addressLine2: e.target.value })
                }
                placeholder="Apt, suite, etc."
                className={commonInput}
              />
            </div>

            {/* City / State / Zip */}
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                City
              </Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="City"
                className={commonInput}
              />
            </div>
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                State
              </Label>
              <Select
                value={form.state || undefined}
                onValueChange={(v) => setForm({ ...form, state: v })}
              >
                <SelectTrigger className={`${commonInput} cursor-pointer`}>
                  <SelectValue placeholder="State" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a2e] border-purple-300/30 max-h-[250px] overflow-y-auto z-50">
                  {STATES.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className="hover:bg-purple-400/30 focus:bg-purple-400/40 cursor-pointer text-white"
                    >
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white font-semibold text-sm mb-2 block">
                Zip
              </Label>
              <Input
                value={form.zip}
                onChange={(e) => setForm({ ...form, zip: e.target.value })}
                placeholder="Zip code"
                className={commonInput}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={cancelForm}
              className="border-purple-300/30 text-purple-600 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!form.nameFirst.trim() || saving}
              className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1" />
              {editingId !== null ? "Update" : "Save"} Contact
            </Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button
          variant="ghost"
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-purple-300/30 text-purple-300 hover:text-white hover:bg-white/5 cursor-pointer h-10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add an Internal Contact
        </Button>
      )}
    </div>
  );
};

export default ContactsTab;
