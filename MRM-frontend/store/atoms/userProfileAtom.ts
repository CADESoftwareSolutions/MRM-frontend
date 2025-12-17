import { User } from "@/types/user";
import { atom } from "jotai";

// Atom for user profile; initial value is null (not logged in)
export const userProfileAtom = atom<User | null>(null);

export const userLoadingAtom = atom(false);
