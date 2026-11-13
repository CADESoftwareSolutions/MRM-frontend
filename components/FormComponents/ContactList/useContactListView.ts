import { useEffect, useState } from "react";
import type { ContactListView } from "@/config/contactsConfig";

const storageKey = (userId: number) => `mrm-contacts-list-view-${userId}`;

const isView = (value: unknown): value is ContactListView => value === "brief" || value === "detailed";

/** Brief / Detailed, remembered per user in this browser. `ready` stays false until the user's
 * saved choice has been read: List writes its default columns as it mounts, so a Brief list that
 * mounted and was swapped straight for the saved Detailed one would overwrite the user's Brief
 * column choices. */
export const useContactListView = (userId: number | undefined) => {
  const [loaded, setLoaded] = useState<{ userId: number; view: ContactListView } | null>(null);

  useEffect(() => {
    if (userId === undefined) return;
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(storageKey(userId));
    } catch {}
    setLoaded({ userId, view: isView(saved) ? saved : "brief" });
  }, [userId]);

  const ready = loaded !== null && loaded.userId === userId;

  const setView = (next: ContactListView) => {
    if (userId === undefined) return;
    setLoaded({ userId, view: next });
    try {
      localStorage.setItem(storageKey(userId), next);
    } catch {}
  };

  return { view: loaded?.view ?? "brief", setView, ready };
};
