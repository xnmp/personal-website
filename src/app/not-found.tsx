import { RunningHead } from "@/components/notebook";
import { Key, Rack, Screen } from "@/components/rack";

export default function NotFound() {
  return (
    <Rack>
      <RunningHead brand="chong" meta={<>bay empty</>} />
      <main id="content" className="blank-leaf" tabIndex={-1}>
        <div className="kicker">404 · empty bay</div>
        <h1>Nothing is mounted here.</h1>
        <p>
          The module moved, or it was never built. The index lists everything
          that is actually in the rack.
        </p>
        <div className="blank-keys">
          <Key href="/" size="lg">
            ← Back to the rack
          </Key>
        </div>
        <Screen tone="rust" className="blank-screen">
          <span className="blank-code">NO SIGNAL</span>
        </Screen>
      </main>
    </Rack>
  );
}
