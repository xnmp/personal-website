import type { ReactNode } from "react";
import { Scene } from "./Scene";

/** The scene every page is pinned into, then a column of sheets. */
export function Rack({ children }: { children: ReactNode }) {
  return (
    <>
      <Scene />
      <div className="rack">
        <div className="rack-inner">
          {children}
        </div>
      </div>
    </>
  );
}
