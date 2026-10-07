import { Fragment } from "react";

/**
 * The quick-open palette as the flagship's screen art: live text lit in the
 * screen's tone, so the letterforms stay crisp at any size and follow the rice.
 * Decorative (the module link carries the name); the rows are the app's real
 * results for "read", with its own match highlighting.
 */
const ROWS: { name: string; match: number[] }[] = [
  { name: "README.md", match: [0, 1, 2, 3] },
  { name: "features/ai-plugins.md", match: [5, 6, 9, 21] },
  { name: "features/views-and-themes.md", match: [5, 6, 15, 17] },
  { name: "features/terminal.md", match: [5, 6, 15, 19] },
];

function Name({ name, match }: { name: string; match: number[] }) {
  return (
    <span className="pal-name">
      {[...name].map((ch, i) => (
        <Fragment key={i}>{match.includes(i) ? <u>{ch}</u> : ch}</Fragment>
      ))}
    </span>
  );
}

export function PaletteScreen() {
  return (
    <div className="pal" aria-hidden>
      <div className="pal-input">
        read<span className="pal-caret" />
      </div>
      <ol className="pal-rows">
        {ROWS.map((r, i) => (
          <li key={r.name} data-selected={i === 0 || undefined}>
            <span className="pal-icon" />
            <Name {...r} />
          </li>
        ))}
      </ol>
    </div>
  );
}
