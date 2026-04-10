import { atom } from "jotai";

export const openAccordionsAtom = atom<string[]>([]);
export const sidebarOpenAtom = atom<boolean>(true);
export const themeAtom = atom<"dark" | "light">("dark");
