import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Z_INDEX } from "@/lib/zIndex";

interface ModalProps {
  onClose?: () => void;
  /** Dismiss when the backdrop (not the panel) is clicked. Off by default since a couple of
   * these modals hold in-progress form/upload state that shouldn't vanish on a stray click. */
  closeOnBackdropClick?: boolean;
  maxWidthClassName?: string;
  /** e.g. "h-[90vh]" for a modal whose content should fill most of the viewport. Omit for a
   * panel that just sizes to its content. */
  heightClassName?: string;
  /** Escape hatch for content mounted somewhere a plain `position: fixed` won't anchor to the
   * viewport (e.g. nested inside a Radix tab panel, which sets a transform on its content and
   * becomes the containing block instead). Portals straight to <body>. */
  portal?: boolean;
  /** Only meaningful with portal: a portaled modal renders outside DashboardLayout's
   * `.light-theme` wrapper, so the theme class has to be reapplied here for its contents. */
  isLight?: boolean;
  children: React.ReactNode;
}

/** Shared overlay + centered panel shell for the app's modals — backdrop, sizing, portal
 * escape, and theme re-application live here once instead of being re-authored per modal.
 * Pair with ModalHeader for the icon/title/close-button row most (not all) modals want. */
export const Modal: React.FC<ModalProps> = ({
  onClose,
  closeOnBackdropClick = false,
  maxWidthClassName = "max-w-lg",
  heightClassName,
  portal = false,
  isLight = false,
  children,
}) => {
  const content = (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/40 p-4 ${
        isLight ? "light-theme" : ""
      }`}
      style={{ zIndex: Z_INDEX.modal }}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`rounded-xl w-full shadow-2xl flex flex-col border ${maxWidthClassName} ${heightClassName ?? ""} ${
          isLight ? "bg-white border-purple-200" : "bg-[#1a1a2e] border-purple-300/30"
        }`}
      >
        {children}
      </div>
    </div>
  );

  return portal ? createPortal(content, document.body) : content;
};

interface ModalHeaderProps {
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  isLight?: boolean;
}

/** Icon + title + close-button row shared by the modals that have one (DeleteConfirmModal
 * doesn't — its compact confirm/cancel layout doesn't fit this shape, so it skips this and
 * builds its own body directly inside Modal). */
export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, icon, onClose, isLight = false }) => (
  <div
    className={`flex items-center justify-between p-6 border-b shrink-0 ${
      isLight ? "border-purple-100" : "border-purple-300/20"
    }`}
  >
    <h2 className={`text-xl font-bold flex items-center gap-2 ${isLight ? "text-gray-900" : "text-white"}`}>
      {icon}
      {title}
    </h2>
    <button
      onClick={onClose}
      className={`transition-colors cursor-pointer ${
        isLight ? "text-gray-400 hover:text-gray-700" : "text-purple-300 hover:text-white"
      }`}
    >
      <X className="w-5 h-5" />
    </button>
  </div>
);
