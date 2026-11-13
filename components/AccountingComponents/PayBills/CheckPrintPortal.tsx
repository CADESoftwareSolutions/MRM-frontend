import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckPreview, CheckPreviewData } from "./CheckPreview";

const PRINT_ROOT_ID = "mrm-check-print-root";

// Hiding body's other children (the app root, toast and dropdown portals) takes the sidebar, app
// bar and any open dialog out of the printout without touching them individually. The ID selector
// outranks Tailwind's layered utilities, so no !important is needed.
const PRINT_CSS = `
@media print {
  html, body { height: auto; min-height: 0; margin: 0; padding: 0; background: white; overflow: visible; }
  body > :not(#${PRINT_ROOT_ID}) { display: none; }
  #${PRINT_ROOT_ID} { display: block; margin: 0; padding: 0; }
}
`;

/** Renders the checks into a print-only container on <body>, one 8½ × 11 page each starting at
 * the sheet's top-left corner. Nothing shows on screen; window.print() prints only these. Mount it
 * only for an explicit print, so Ctrl+P elsewhere can't print real checks; `onReady` fires once
 * the checks are in the DOM. */
export const CheckPrintPortal = ({ checks, onReady }: { checks: CheckPreviewData[]; onReady?: () => void }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.dataset.checkPrint = "";
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);
    setMounted(true);
    return () => style.remove();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const frame = requestAnimationFrame(() => onReady?.());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  return createPortal(
    <div id={PRINT_ROOT_ID} aria-hidden="true" className="hidden print:block">
      {checks.map((check) => (
        <CheckPreview key={check.checkNumber} check={check} />
      ))}
    </div>,
    document.body,
  );
};

export default CheckPrintPortal;
