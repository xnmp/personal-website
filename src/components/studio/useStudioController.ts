"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ContentBinding } from "@/lib/studio/bindings";
import type { StudioDocument } from "@/lib/studio/document";
import type { PublishJob } from "@/lib/studio/publish.server";
import {
  acceptSaved,
  draftKey,
  draftValue,
  hasEdits,
  recoverDraft,
  updateDraft,
  type Drafts,
} from "@/lib/studio/drafts";

const busy = (job: PublishJob) =>
  ["validating", "building", "pushing", "deploying"].includes(job.phase);
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Editor request failed";

export function useStudioController(token: string) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Drafts>({});
  const draftsRef = useRef<Drafts>({});
  const operation = useRef(false);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [job, setJob] = useState<PublishJob>({ phase: "idle", message: "" });
  const deploying = busy(job);

  const toggleEditing = useCallback(() => {
    if (!ready || operation.current || saving || deploying) return;
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      (active.isContentEditable || active.matches("input, textarea, select"))
    )
      active.blur();
    setEditing((current) => !current);
  }, [ready, saving, deploying]);

  useEffect(() => {
    const toggleShortcut = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.shiftKey ||
        event.key.toLowerCase() !== "e"
      )
        return;
      event.preventDefault();
      if (!event.repeat) toggleEditing();
    };
    window.addEventListener("keydown", toggleShortcut);
    return () => window.removeEventListener("keydown", toggleShortcut);
  }, [toggleEditing]);

  const request = useCallback(
    async (path = "", body?: unknown) => {
      const response = await fetch(`/api/studio${path}`, {
        method: body ? "POST" : "GET",
        cache: "no-store",
        headers: {
          "x-studio-token": token,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Editor request failed");
      return result;
    },
    [token],
  );

  const replaceDrafts = useCallback((next: Drafts) => {
    draftsRef.current = next;
    setDrafts(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void request()
      .then((result) => {
        if (cancelled) return;
        const recovered: Drafts = {};
        for (const entry of result.documents as { id: string }[]) {
          try {
            const draft = recoverDraft(
              localStorage.getItem(draftKey(entry.id)),
            );
            if (draft && hasEdits(draft)) recovered[entry.id] = draft;
          } catch (error) {
            setError(errorMessage(error));
          }
        }
        replaceDrafts(recovered);
        setJob(result.job);
        setReady(true);
        if (Object.keys(recovered).length)
          setNotice("Recovered unsaved edits.");
      })
      .catch((error) => {
        if (!cancelled) setError(errorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [request, replaceDrafts]);

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (Object.values(draftsRef.current).some(hasEdits))
        event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, []);

  useEffect(() => {
    if (!deploying) return;
    const interval = setInterval(() => {
      void request("?status=1")
        .then((result) => setJob(result.job))
        .catch((error) => setError(errorMessage(error)));
    }, 1500);
    return () => clearInterval(interval);
  }, [deploying, request]);

  const persist = useCallback((id: string, next: Drafts) => {
    try {
      const draft = next[id];
      if (draft && hasEdits(draft))
        localStorage.setItem(
          draftKey(id),
          JSON.stringify({ revision: draft.revision, edits: draft.edits }),
        );
      else localStorage.removeItem(draftKey(id));
    } catch {
      setNotice(
        "Browser draft storage is unavailable. Save before closing this tab.",
      );
    }
  }, []);

  const update = (binding: ContentBinding, value: string) => {
    if (operation.current || deploying || !ready) return;
    const next = updateDraft(draftsRef.current, binding, value);
    replaceDrafts(next);
    setNotice("");
    persist(binding.documentId, next);
  };

  const save = useCallback(async (deploy = false) => {
    if (operation.current || deploying || !ready) return;
    operation.current = true;
    setSaving(true);
    setError("");
    try {
      for (const [id, snapshot] of Object.entries(draftsRef.current).filter(
        ([, draft]) => hasEdits(draft),
      )) {
        const { document } = (await request("", {
          action: "save",
          id,
          revision: snapshot.revision,
          edits: snapshot.edits,
        })) as { document: StudioDocument };
        const next = acceptSaved(draftsRef.current, id, snapshot, document);
        replaceDrafts(next);
        persist(id, next);
      }
      router.refresh();
      setNotice("Saved to your Markdown files.");
      if (deploy) {
        const result = await request("", { action: "deploy" });
        setJob(result.job);
        setNotice("");
      }
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      operation.current = false;
      setSaving(false);
    }
  }, [deploying, ready, request, replaceDrafts, persist, router]);

  useEffect(() => {
    const saveShortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || event.key !== "Enter" ||
        !(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return;
      event.preventDefault();
      if (event.repeat) return;
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement && active.matches(".studio-input")) active.blur();
      if (Object.values(draftsRef.current).some(hasEdits)) void save();
    };
    window.addEventListener("keydown", saveShortcut);
    return () => window.removeEventListener("keydown", saveShortcut);
  }, [save]);

  const discard = () => {
    if (
      !window.confirm(
        "Discard all unsaved browser edits and reload the Markdown files?",
      )
    )
      return;
    for (const id of Object.keys(draftsRef.current)) {
      try {
        localStorage.removeItem(draftKey(id));
      } catch {
        /* disk content is authoritative */
      }
    }
    replaceDrafts({});
    setEditing(false);
    setError("");
    setNotice("");
    router.refresh();
  };

  return {
    context: {
      editing,
      locked: saving || deploying,
      ready,
      value: (binding: ContentBinding) => draftValue(drafts, binding),
      update,
    },
    editing,
    toggleEditing,
    ready,
    locked: saving || deploying,
    saving,
    job,
    error,
    notice,
    unsaved: Object.values(drafts).filter(hasEdits).length,
    save,
    discard,
  };
}
