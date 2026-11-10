import { atom } from "jotai";

export interface ToastItem {
  id: number;
  message: string;
}

export const toastsAtom = atom<ToastItem[]>([]);

let nextToastId = 0;

// Write-only: a plain atom rather than a hook/callback prop, so deeply nested components (e.g.
// LegalDescriptionForm, several layers under the Deed/Lease/Well page) can fire a toast without
// threading an onToast prop down through every layer in between. Toasts stay up until the user
// closes them (dismissToastAtom); there's deliberately no auto-dismiss timer.
export const showToastAtom = atom(null, (get, set, message: string) => {
  set(toastsAtom, [...get(toastsAtom), { id: ++nextToastId, message }]);
});

export const dismissToastAtom = atom(null, (get, set, id: number) => {
  set(toastsAtom, get(toastsAtom).filter((toast) => toast.id !== id));
});
