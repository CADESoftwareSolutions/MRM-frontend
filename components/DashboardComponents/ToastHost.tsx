import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2 } from "lucide-react";
import { useAtom } from "jotai";
import { toastsAtom, ToastItem } from "@/atoms/toastAtom";
import { themeAtom } from "@/atoms/NavigationAtom";
import { Z_INDEX } from "@/lib/zIndex";

const ToastCard = ({ toast, isLight }: { toast: ToastItem; isLight: boolean }) => {
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
    </div>
  );
};

/** Mounted once in DashboardLayout. Renders whatever's in toastsAtom (src/atoms/toastAtom.ts)
 * bottom-center for visibility — push a message from anywhere via `useSetAtom(showToastAtom)`.
 * The outer layer is pointer-events-none so the toast never blocks clicks on the form
 * underneath it; only the card itself re-enables them. */
export const ToastHost = () => {
  const [toasts] = useAtom(toastsAtom);
  const [theme] = useAtom(themeAtom);
  const isLight = theme === "light";

  if (toasts.length === 0) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-end gap-2 pointer-events-none px-4 pb-16"
      style={{ zIndex: Z_INDEX.toast }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} isLight={isLight} />
      ))}
    </div>,
    document.body,
  );
};

export default ToastHost;
