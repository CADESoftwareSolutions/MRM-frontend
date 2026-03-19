import { User } from "@/types/user";
import { atom } from "jotai";

export const userProfileAtom = atom<User | null>(null);

export const userLoadingAtom = atom(false);
