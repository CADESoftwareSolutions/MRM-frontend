import { useEffect, useRef, useState } from "react";

/** The Recordation and Legal Description tabs' "saved entries first" add flow: with nothing saved
 * yet the blank form always shows; after that it hides behind an "Add New …" button (AddNewButton)
 * and opens below the saved entries, scrolled into view. Starting closed is what brings a remount
 * (e.g. a parent's `key` bump) back to the button. Give the anchorRef element scroll-mt-20 so a
 * form taller than the viewport lands clear of the fixed 64px app header. */
export const useAddFormToggle = (hasEntries: boolean) => {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) anchorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isOpen]);

  return {
    anchorRef,
    showForm: !hasEntries || isOpen,
    showAddButton: hasEntries && !isOpen,
    /** Separates the open form from the saved entries above it. */
    showDivider: hasEntries && isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
};
