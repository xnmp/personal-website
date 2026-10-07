"use client";

import { Fragment } from "react";
import { withShortcutsFor } from "./shortcuts";
import { useOS } from "./useOS";

/** Text whose shortcuts read as the visitor's keyboard prints them (⌘ on a
 * Mac). The server and first render print the app's own Ctrl spelling. The
 * "+" of a chord is wrapped (`.chord-plus`), so a headline can set it as
 * heavily as the letters around it: a display face's plus is a hairline. */
export function ForOS({ children }: { children: string }) {
  const parts = withShortcutsFor(children, useOS()).split(/(?<=\w)\+(?=\w)/);
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 ? <span className="chord-plus">+</span> : null}
      {part}
    </Fragment>
  ));
}
