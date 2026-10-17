import { withShortcutsFor } from "../../components/launch/shortcuts";

type ShortcutAtom = {
  sourceStart: number;
  sourceEnd: number;
  displayStart: number;
  displayEnd: number;
};

// Match the canonical tokens accepted by withShortcutsFor. The shared converter
// owns the actual legends, modifier order and macOS-reserved Control bindings.
const SHORTCUT =
  /\b(?:(?:Ctrl|Alt|Shift)\+)+(?:F\d{1,2}\b|Tab\b|Space\b|[A-Za-z0-9](?![A-Za-z0-9])|`)/g;

/** Apply one visible text edit while retaining untouched canonical shortcuts. */
export function editShortcutText(
  source: string,
  previousDisplay: string,
  nextDisplay: string,
): string {
  if (
    typeof source !== "string" ||
    typeof previousDisplay !== "string" ||
    typeof nextDisplay !== "string"
  ) {
    throw new TypeError("Shortcut source and displays must be strings");
  }
  // This also handles the server's initial rendering and non-Mac platforms.
  if (source === previousDisplay) return nextDisplay;
  if (withShortcutsFor(source, "mac") !== previousDisplay) {
    throw new RangeError("Previous shortcut display does not match its source");
  }
  if (previousDisplay === nextDisplay) return source;

  let start = 0;
  while (
    start < previousDisplay.length &&
    start < nextDisplay.length &&
    previousDisplay[start] === nextDisplay[start]
  ) {
    start++;
  }
  let end = previousDisplay.length;
  let nextEnd = nextDisplay.length;
  while (
    end > start &&
    nextEnd > start &&
    previousDisplay[end - 1] === nextDisplay[nextEnd - 1]
  ) {
    end--;
    nextEnd--;
  }

  const atoms: ShortcutAtom[] = [];
  let difference = 0;
  for (const match of source.matchAll(SHORTCUT)) {
    const sourceStart = match.index;
    const displayStart = sourceStart - difference;
    const display = withShortcutsFor(match[0], "mac");
    atoms.push({
      sourceStart,
      sourceEnd: sourceStart + match[0].length,
      displayStart,
      displayEnd: displayStart + display.length,
    });
    difference += match[0].length - display.length;
  }

  let expandedStart = start;
  let expandedEnd = end;
  for (const atom of atoms) {
    if (start > atom.displayStart && start < atom.displayEnd) {
      expandedStart = atom.displayStart;
    }
    if (end > atom.displayStart && end < atom.displayEnd) {
      expandedEnd = atom.displayEnd;
    }
  }

  const sourceOffset = (offset: number): number => {
    let difference = 0;
    for (const atom of atoms) {
      if (offset <= atom.displayStart) break;
      if (offset === atom.displayEnd) return atom.sourceEnd;
      difference +=
        atom.sourceEnd -
        atom.sourceStart -
        (atom.displayEnd - atom.displayStart);
    }
    return offset + difference;
  };

  const replace = (): string =>
    source.slice(0, sourceOffset(expandedStart)) +
    previousDisplay.slice(expandedStart, start) +
    nextDisplay.slice(start, nextEnd) +
    previousDisplay.slice(end, expandedEnd) +
    source.slice(sourceOffset(expandedEnd));

  const result = replace();
  const expectedDisplay = withShortcutsFor(nextDisplay, "mac");
  if (withShortcutsFor(result, "mac") === expectedDisplay) return result;

  // A boundary edit can stop a neighboring raw token from matching: removing
  // the space in "Use ⌘P" must not turn it into the visible "UseCtrl+P".
  // Materialize only the shortcut atoms at the changed boundaries in that case.
  for (const atom of atoms) {
    if (start >= atom.displayStart && start <= atom.displayEnd) {
      expandedStart = Math.min(expandedStart, atom.displayStart);
      expandedEnd = Math.max(expandedEnd, atom.displayEnd);
    }
    if (end >= atom.displayStart && end <= atom.displayEnd) {
      expandedStart = Math.min(expandedStart, atom.displayStart);
      expandedEnd = Math.max(expandedEnd, atom.displayEnd);
    }
  }
  return replace();
}
