import { atom } from "jotai";

export interface ToastItem {
  id: number;
  message: string;
}

export const toastsAtom = atom<ToastItem[]>([]);

let nextToastId = 0;
const TOAST_DURATION_MS = 4000;

// Write-only: a plain atom rather than a hook/callback prop, so deeply nested components (e.g.
// LegalDescriptionForm, several layers under the Deed/Lease/Well page) can fire a toast without
// threading an onToast prop down through every layer in between.
export const showToastAtom = atom(null, (get, set, message: string) => {
  const id = ++nextToastId;
  set(toastsAtom, [...get(toastsAtom), { id, message }]);
  setTimeout(() => {
    set(toastsAtom, get(toastsAtom).filter((toast) => toast.id !== id));
  }, TOAST_DURATION_MS);
});
