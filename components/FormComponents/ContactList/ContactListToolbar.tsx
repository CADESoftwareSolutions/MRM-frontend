import type { ReactNode } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONTACT_LIST_VIEWS, ContactListView } from "@/config/contactsConfig";

const VIEWS = Object.keys(CONTACT_LIST_VIEWS) as ContactListView[];

interface ContactListToolbarProps {
  view: ContactListView;
  onViewChange: (view: ContactListView) => void;
  onReport: () => void;
  reportDisabled?: boolean;
  onAdd: () => void;
  /** More buttons, shown before the report button. */
  extraActions?: ReactNode;
  isLight: boolean;
}

export const ContactListToolbar = ({
  view,
  onViewChange,
  onReport,
  reportDisabled,
  onAdd,
  extraActions,
  isLight,
}: ContactListToolbarProps) => {
  const outlineButton = `bg-transparent shadow-none cursor-pointer ${
    isLight
      ? "border-purple-300 text-purple-700 hover:bg-purple-100 hover:text-purple-800"
      : "border-purple-300/30 text-purple-200 hover:bg-purple-500/20 hover:text-white"
  }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="View" className="flex gap-0.5 p-[3px] rounded-[10px] bg-white/5 border border-purple-300/20">
          {VIEWS.map((id) => {
            const active = view === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => onViewChange(id)}
                className={`h-[30px] rounded-md px-3.5 text-sm font-medium transition-colors cursor-pointer ${
                  active
                    ? "bg-purple-600 text-white"
                    : isLight
                      ? "text-purple-700 hover:bg-purple-200/60"
                      : "text-purple-100 hover:bg-purple-500/30 hover:text-white"
                }`}
              >
                {CONTACT_LIST_VIEWS[id].label}
              </button>
            );
          })}
        </div>
        <span className={`text-xs ${isLight ? "text-gray-500" : "text-white/70"}`}>{CONTACT_LIST_VIEWS[view].help}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {extraActions}
        <Button variant="outline" onClick={onReport} disabled={reportDisabled} className={outlineButton}>
          <Download className="w-4 h-4" />
          Name &amp; Address Report
        </Button>
        <Button onClick={onAdd} className="bg-purple-600 hover:bg-purple-700 cursor-pointer">
          <Plus className="w-4 h-4" />
          Add New Contact
        </Button>
      </div>
    </div>
  );
};

export default ContactListToolbar;
