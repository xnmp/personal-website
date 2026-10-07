"use client";

import { withShortcutsFor } from "./shortcuts";
import { useOS } from "./useOS";

/** Text whose shortcuts read as the visitor's keyboard prints them (⌘ on a
 * Mac). The server and first render print the app's own Ctrl spelling. */
export function ForOS({ children }: { children: string }) {
  return withShortcutsFor(children, useOS());
}
