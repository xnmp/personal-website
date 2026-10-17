import { describe, expect, test } from "bun:test";
import { acceptSaved, draftValue, recoverDraft, updateDraft } from "../src/lib/studio/drafts";
import type { ContentBinding } from "../src/lib/studio/bindings";
import type { StudioDocument } from "../src/lib/studio/document";

const revision = "a".repeat(64);
const binding: ContentBinding = { documentId: "home", slotId: "block:intro", label: "intro", revision, value: "Original **Markdown**." };
const saved = (value: string, revision = "b".repeat(64)): StudioDocument => ({ id: "home", title: "Home", route: "/", source: "", revision, slots: [{ id: binding.slotId, value, kind: "markdown", label: "intro", start: 0, end: 0 }] });

describe("in-place source drafts", () => {
  test("retains exact Markdown, supports clearing a block and removes reverted edits", () => {
    const drafts = updateDraft({}, binding, "[A link](/about)\n\n:kbd[Ctrl+P]");
    expect(draftValue(drafts, binding)).toBe("[A link](/about)\n\n:kbd[Ctrl+P]");
    expect(draftValue(updateDraft(drafts, binding, ""), binding)).toBe("");
    expect(updateDraft(drafts, binding, binding.value).home.edits).toEqual({});
  });
  test("uses saved revision for a second save and retains input newer than a save snapshot", () => {
    const snapshot = updateDraft({}, binding, "First edit");
    const newer = updateDraft(snapshot, binding, "Second edit");
    const accepted = acceptSaved(newer, "home", snapshot.home, saved("First edit"));
    expect(draftValue(accepted, binding)).toBe("Second edit");
    expect(accepted.home.revision).toBe("b".repeat(64));
    const finished = acceptSaved(snapshot, "home", snapshot.home, saved("First edit"));
    expect(draftValue(finished, binding)).toBe("First edit");
    expect(updateDraft(finished, binding, "Third edit").home.revision).toBe("b".repeat(64));
  });
  test("new disk content supersedes a clean saved preview but never overwrites unsaved work", () => {
    const drafts = updateDraft({}, binding, "My draft");
    const external = { ...binding, revision: "c".repeat(64), value: "External edit" };
    expect(draftValue(drafts, external)).toBe("My draft");
    const clean = acceptSaved(drafts, "home", drafts.home, saved("My draft"));
    expect(draftValue(clean, external)).toBe("External edit");
    expect(updateDraft(clean, external, "After external edit").home.revision).toBe(external.revision);
  });
  test("repeated saves keep every still-rendered successful revision usable", () => {
    const first = updateDraft({}, binding, "First");
    const firstSaved = acceptSaved(first, "home", first.home, saved("First"));
    const bindingB = { ...binding, value: "First", revision: "b".repeat(64) };
    const second = updateDraft(firstSaved, bindingB, "Second");
    const secondSaved = acceptSaved(second, "home", second.home, saved("Second", "c".repeat(64)));
    expect(updateDraft(secondSaved, bindingB, "Third").home.revision).toBe("c".repeat(64));
    expect(draftValue(secondSaved, bindingB)).toBe("Second");
    expect(draftValue(secondSaved, { ...bindingB, revision: "d".repeat(64), value: "External" })).toBe("External");
  });
  test("recovered drafts preserve stale revisions for conflict detection and reject malformed storage", () => {
    const recovered = recoverDraft(JSON.stringify({ revision, edits: { "block:intro": "Recovered" } }));
    expect(draftValue({ home: recovered! }, { ...binding, revision: "c".repeat(64) })).toBe("Recovered");
    expect(recovered!.revision).toBe(revision);
    for (const value of ["bad", "null", JSON.stringify({ revision, edits: [] }), JSON.stringify({ revision, edits: { a: null } }), JSON.stringify({ revision: "stale", edits: {} })]) expect(() => recoverDraft(value)).toThrow();
    expect(recoverDraft(null)).toBeUndefined();
  });
});
