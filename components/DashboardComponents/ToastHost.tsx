import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";
import { dismissToastAtom, toastsAtom, ToastItem } from "@/atoms/toastAtom";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";

const ToastCard = ({
  toast,
  isLight,
  onClose,
}: {
  toast: ToastItem;
  isLight: boolean;
  onClose: () => void;
}) => {
  // Starts translated/transparent and flips to visible a frame later — a CSS transition can't
  // animate from "just mounted," so the pre-transition class has to render first.
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={`pointer-events-auto flex items-center gap-2 rounded-lg border px-5 py-4 shadow-2xl transition-all duration-200 ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      } ${isLight ? "bg-white border-purple-200 text-gray-800" : "bg-[#1a1a2e] border-purple-300/30 text-white"}`}
    >
      <CheckCircle2 className={`w-5 h-5 shrink-0 ${isLight ? "text-purple-600" : "text-purple-300"}`} />
      <span className="text-sm font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className={`ml-2 -mr-2 rounded-md p-1 transition-colors cursor-pointer ${
          isLight
            ? "text-gray-500 hover:text-gray-800 hover:bg-purple-50"
            : "text-purple-300/70 hover:text-white hover:bg-purple-500/20"
        }`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

/** Mounted once in DashboardLayout. Renders whatever's in toastsAtom (src/atoms/toastAtom.ts)
 * bottom-center for visibility — push a message from anywhere via `useSetAtom(showToastAtom)`;
 * each one stays until its X is clicked.
 * The outer layer is pointer-events-none so the toast never blocks clicks on the form
 * underneath it; only the card itself re-enables them. */
export const ToastHost = () => {
  const [toasts] = useAtom(toastsAtom);
  const dismissToast = useSetAtom(dismissToastAtom);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-end gap-2 pointer-events-none px-4 pb-16"
      style={{ zIndex: Z_INDEX.toast }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} isLight={isLight} onClose={() => dismissToast(toast.id)} />
      ))}
    </div>,
    document.body,
  );
};

export default ToastHost;
