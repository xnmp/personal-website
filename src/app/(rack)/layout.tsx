import { Rack } from "@/components/rack/Rack";

/** Everything in this group is a module mounted in the rack. Standalone
 *  showcases (e.g. /tableau-frog) live outside it and keep their own look. */
export default function RackLayout({ children }: { children: React.ReactNode }) {
  return <Rack>{children}</Rack>;
}
