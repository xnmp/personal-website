/** A cut-paper piece on a sheet's edge (art/BRIEF.md): a brass pin holding
 *  a sheet up. Decorative. */
export function Prop({ kind }: { kind: "pin" }) {
  return <span className="prop" data-prop={kind} aria-hidden />;
}
