export function TauriSchematic() {
  return (
    <>
      <div className="pane">
        <div className="path">~ / projects</div>
        <div className="row">◀ ..</div>
        <div className="row sel"><span className="ic">▸</span>personal-website/</div>
        <div className="row"><span className="ic">▸</span>tauri-explorer/</div>
        <div className="row"><span className="ic">▸</span>lambda-query-2/</div>
        <div className="row"><span className="ic">▪</span>eskiv/</div>
        <div className="row"><span className="ic">▪</span>notes.md</div>
      </div>
      <div className="pane">
        <div className="path">~ / projects / personal-website</div>
        <div className="row"><span className="ic">▸</span>src/</div>
        <div className="row"><span className="ic">▸</span>content/</div>
        <div className="row sel"><span className="ic">▪</span>README.md</div>
        <div className="row"><span className="ic">▪</span>package.json</div>
        <div className="row"><span className="ic">▪</span>tsconfig.json</div>
        <div className="palette">
          <div className="q">
            ⌘ P &nbsp;{" "}
            <span style={{ color: "var(--ink-soft)" }}>open globals.css</span>
          </div>
          <div className="hint">
            <span className="k">↵</span>open &nbsp;&nbsp;
            <span className="k">⌘↵</span>reveal &nbsp;&nbsp;
            <span className="k">⇥</span>split pane
          </div>
        </div>
      </div>
    </>
  );
}
