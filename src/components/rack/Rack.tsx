import type { ReactNode } from "react";
import { StylePicker } from "@/components/instrument/StylePicker";
import { Scene } from "./Scene";

/** The scene every page is pinned into, then a column of sheets, ending in
 *  the art-direction picker. */
export function Rack({ children }: { children: ReactNode }) {
  return (
    <>
      <Scene />
      <div className="rack">
        <div className="rack-inner">
          {children}
          <StylePicker />
        </div>
      </div>
    </>
  );
}
