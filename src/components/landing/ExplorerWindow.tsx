import { ForOS } from "@/components/launch/ForOS";
import { FLAGSHIP, projects } from "@/data/projects";

/** ~/Repos as the app lists it: the app's own folder first (selected), then
 *  the other projects on this site, and the dotfiles that colour its
 *  screens. From the data, so a new project is in the list. */
const REPOS = [FLAGSHIP, ...projects.map((p) => p.slug).filter((s) => s !== FLAGSHIP), "dotfiles"];

/** The app's own folder, its top level as the repository has it. */
const FILES: { name: string; kind: string }[] = [
  { name: "docs", kind: "dir" },
  { name: "e2e", kind: "dir" },
  { name: "scripts", kind: "dir" },
  { name: "src", kind: "dir" },
  { name: "src-tauri", kind: "dir" },
  { name: "static", kind: "dir" },
  { name: "CHANGELOG.md", kind: "md" },
  { name: "README.md", kind: "md" },
  { name: "package.json", kind: "json" },
  { name: "svelte.config.js", kind: "js" },
];

/** The status line's legend: the chords the app is driven by, and what each
 *  does. Each key is its own element, so a style may set them as keycaps. */
const HINTS = [
  { keys: "Ctrl+P", does: "open anything" },
  { keys: "Ctrl+Shift+F", does: "find in files" },
  { keys: "Ctrl+Shift+P", does: "commands" },
];

function Pane({ path, rows, selected }: { path: string; rows: { name: string; kind: string }[]; selected?: number }) {
  return (
    <div className="xw-pane">
      <div className="xw-path">{path}</div>
      <ul className="xw-rows">
        {rows.map((r, i) => (
          <li key={r.name} data-selected={i === selected || undefined}>
            <span className="xw-icon" data-kind={r.kind === "dir" ? "dir" : "file"} />
            <span className="xw-name">{r.name}</span>
            <span className="xw-kind">{r.kind}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tauri Explorer's window, on the home page's first screen beside its name:
 * the app's two panes, ~/Repos with the app's own folder open beside it, set
 * as live text in the active rice (as every screen here is), so it stays
 * crisp at any size and follows the theme. Decorative: the link round it
 * carries the name.
 */
export function ExplorerWindow() {
  return (
    <div className="xw" aria-hidden>
      <div className="xw-bar">
        <span className="xw-lights">
          <i />
          <i />
          <i />
        </span>
        <span className="xw-title">Tauri Explorer</span>
      </div>
      <div className="xw-panes">
        <Pane path="~/Repos" rows={REPOS.map((name) => ({ name, kind: "dir" }))} selected={0} />
        <Pane path="~/Repos/tauri-explorer" rows={FILES} />
      </div>
      <div className="xw-status">
        <span className="xw-mode">1/{REPOS.length}</span>
        <span className="xw-hints">
          {HINTS.map((h) => (
            <span key={h.keys} className="xw-hint">
              <kbd>
                <ForOS>{h.keys}</ForOS>
              </kbd>{" "}
              {h.does}
            </span>
          ))}
        </span>
        <span className="xw-branch">main</span>
      </div>
    </div>
  );
}
