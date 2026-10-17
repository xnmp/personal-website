import type { ContentBinding } from "./bindings";
import type { StudioDocument } from "./document";

export type Draft = {
  revision: string;
  renderedRevision: string;
  previousRevisions?: string[];
  edits: Record<string, string>;
  savedValues?: Record<string, string>;
};
export type Drafts = Record<string, Draft>;
export const draftKey = (id: string) => `content-studio:v1:draft:${id}`;
export const hasEdits = (draft: Draft) => Object.keys(draft.edits).length > 0;

export function recoverDraft(serialized: string | null): Draft | undefined {
  if (!serialized) return;
  const value = JSON.parse(serialized);
  if (!value || typeof value.revision !== "string" || !/^[a-f0-9]{64}$/.test(value.revision) || !value.edits || typeof value.edits !== "object" || Array.isArray(value.edits) || Object.values(value.edits).some((edit) => typeof edit !== "string")) throw new Error("The browser draft is malformed. Export or clear it before editing.");
  return { revision: value.revision, renderedRevision: value.revision, edits: value.edits };
}

const applies = (draft: Draft, binding: ContentBinding) => hasEdits(draft) || [draft.revision, draft.renderedRevision, ...(draft.previousRevisions ?? [])].includes(binding.revision);
export function draftValue(drafts: Drafts, binding: ContentBinding): string {
  const draft = drafts[binding.documentId];
  return draft && applies(draft, binding) ? draft.edits[binding.slotId] ?? draft.savedValues?.[binding.slotId] ?? binding.value : binding.value;
}

export function updateDraft(drafts: Drafts, binding: ContentBinding, value: string): Drafts {
  const previous = drafts[binding.documentId];
  const draft = previous && applies(previous, binding) ? previous : { revision: binding.revision, renderedRevision: binding.revision, edits: {} };
  const edits = { ...draft.edits, [binding.slotId]: value };
  if (value === (draft.savedValues?.[binding.slotId] ?? binding.value)) delete edits[binding.slotId];
  return { ...drafts, [binding.documentId]: { ...draft, edits } };
}

/** Keep edits made after a save snapshot; never silently drop newer input. */
export function acceptSaved(drafts: Drafts, id: string, snapshot: Draft, document: StudioDocument): Drafts {
  const current = drafts[id] ?? snapshot;
  const edits = Object.fromEntries(Object.entries(current.edits).filter(([slot, value]) => snapshot.edits[slot] !== value));
  return { ...drafts, [id]: {
    revision: document.revision, renderedRevision: current.renderedRevision,
    previousRevisions: [...new Set([...(current.previousRevisions ?? []), snapshot.revision])],
    edits, savedValues: Object.fromEntries(document.slots.map((slot) => [slot.id, slot.value])),
  } };
}
