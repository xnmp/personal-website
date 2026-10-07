"use client";

import { useSyncExternalStore } from "react";
import { THEME_EVENT } from "@/components/instrument/CommandIndex";
import { appThemeFor, type AppTheme } from "./appTheme";

function subscribe(cb: () => void) {
  window.addEventListener(THEME_EVENT, cb);
  return () => window.removeEventListener(THEME_EVENT, cb);
}
const snapshot = () => document.documentElement.dataset.rice ?? null;
const serverSnapshot = () => null;

/** The app theme that wears the current rice; the paper one on the server. */
export const useAppTheme = (): AppTheme => appThemeFor(useSyncExternalStore(subscribe, snapshot, serverSnapshot));
