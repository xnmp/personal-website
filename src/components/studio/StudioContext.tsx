"use client";

import { createContext, useContext } from "react";
import type { ContentBinding } from "@/lib/studio/bindings";

export type StudioContextValue = {
  editing: boolean;
  locked: boolean;
  ready: boolean;
  value: (binding: ContentBinding) => string;
  update: (binding: ContentBinding, value: string) => void;
};
export const StudioContext = createContext<StudioContextValue | null>(null);
export const useStudio = () => useContext(StudioContext);
