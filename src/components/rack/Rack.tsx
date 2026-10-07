import type { ReactNode } from "react";

/** The bench backdrop and the two rails every rack page is mounted between. */
export function Rack({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="bench" aria-hidden />
      <div className="rack">
        <div className="rack-inner">{children}</div>
      </div>
    </>
  );
}
