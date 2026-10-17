"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/notebook/Markdown";
import { ThemeMenu } from "@/components/instrument/ThemeMenu";
import type { Slot, StudioDocument } from "@/lib/studio/document";
import type { PublishJob } from "@/lib/studio/publish.server";

type Entry = Pick<StudioDocument, "id" | "title" | "route">;
type Draft = { document: StudioDocument; edits: Record<string, string> };
const busy = (job: PublishJob) =>
  ["validating", "building", "pushing", "deploying"].includes(job.phase);
const key = (id: string) => `content-studio:v1:draft:${id}`;
const dirty = (draft: Draft) => Object.keys(draft.edits).length > 0;

function EditBlock({
  slot,
  value,
  onChange,
  disabled,
}: {
  slot: Slot;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const select = useRef<HTMLSelectElement>(null);
  useEffect(() => {
    if (editing) {
      select.current?.focus();
      input.current?.focus();
      input.current?.setSelectionRange(
        input.current.value.length,
        input.current.value.length,
      );
    }
  }, [editing]); // cursor placement only when opening
  return (
    <section className="studio-block" data-editing={editing || undefined}>
      <div className="studio-block-label">
        <label htmlFor={`slot-${slot.id}`}>{slot.label}</label>
        <span>{slot.kind === "markdown" ? "Markdown" : slot.kind}</span>
      </div>
      {editing ? (
        <>
          {slot.kind === "boolean" ? (
            <select
              ref={select}
              id={`slot-${slot.id}`}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled}
            >
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          ) : (
            <textarea
              ref={input}
              id={`slot-${slot.id}`}
              aria-label={slot.label}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              disabled={disabled}
              rows={Math.max(
                2,
                Math.min(
                  18,
                  value.split("\n").length + Math.ceil(value.length / 90),
                ),
              )}
              spellCheck={slot.kind !== "number"}
            />
          )}
          <div className="studio-block-actions">
            <span>
              {slot.kind === "markdown"
                ? "Links, emphasis and existing inline helpers are supported."
                : "This updates the existing source field."}
            </span>
            <button type="button" onClick={() => setEditing(false)}>
              Done
            </button>
          </div>
        </>
      ) : (
        <div className="studio-editable">
          <div className="studio-rendered">
            {slot.kind === "markdown" ? (
              <Markdown text={value} />
            ) : (
              <p>{value || <em>Empty</em>}</p>
            )}
          </div>
          <button
            type="button"
            className="studio-edit-button"
            aria-label={`Edit ${slot.label}`}
            disabled={disabled}
            onClick={() => setEditing(true)}
          >
            Edit
          </button>
        </div>
      )}
    </section>
  );
}

export function ContentStudio({ token }: { token: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [activeId, setActiveId] = useState("home");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftsRef = useRef(drafts);
  useEffect(() => {
    draftsRef.current = drafts;
  }, [drafts]);
  const [job, setJob] = useState<PublishJob>({
    phase: "idle",
    message: "Local content editor",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"edit" | "preview">("edit");
  const [filter, setFilter] = useState("");
  const [previewVersion, setPreviewVersion] = useState(0);
  const active = drafts[activeId];
  const deploying = busy(job);
  const locked = saving || deploying;
  const unsaved = Object.values(drafts).filter(dirty).length;

  const request = useCallback(
    async (path = "", body?: unknown) => {
      const response = await fetch(`/api/studio${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          "x-studio-token": token,
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Editor request failed");
      return result;
    },
    [token],
  );

  const load = useCallback(
    async (id: string, discard = false) => {
      const { document } = (await request(`?id=${encodeURIComponent(id)}`)) as {
        document: StudioDocument;
      };
      let edits = {};
      if (!discard) {
        try {
          const stored = JSON.parse(localStorage.getItem(key(id)) ?? "null");
          if (
            stored?.revision === document.revision &&
            stored.edits &&
            typeof stored.edits === "object"
          )
            edits = stored.edits;
          else if (stored?.edits && Object.keys(stored.edits).length) {
            setNotice(
              "A recovered draft has a different file revision. Its edits are kept below; saving will report the conflict.",
            );
            setDrafts((current) => ({
              ...current,
              [id]: {
                document: { ...document, revision: stored.revision },
                edits: stored.edits,
              },
            }));
            return;
          }
        } catch {
          setNotice(
            "Browser draft storage is unavailable. Keep this tab open until you save locally.",
          );
        }
      }
      setDrafts((current) => ({ ...current, [id]: { document, edits } }));
    },
    [request],
  );

  useEffect(() => {
    document.documentElement.dataset.style = "margin";
    document.documentElement.dataset.sceneArt = "none";
    void request()
      .then((result) => {
        setEntries(result.documents);
        setJob(result.job);
        // Recover drafts from other documents too, so Deploy never overlooks them after restart.
        for (const entry of result.documents as Entry[]) {
          if (entry.id === "home") continue;
          try {
            const stored = JSON.parse(
              localStorage.getItem(key(entry.id)) ?? "null",
            );
            if (stored?.edits && Object.keys(stored.edits).length)
              void load(entry.id).catch((error) => setError(error.message));
          } catch {
            setNotice(
              "Some browser drafts could not be recovered. Keep a copy before clearing storage.",
            );
          }
        }
      })
      .catch((error) => setError(error.message));
    void load("home").catch((error) => setError(error.message));
  }, [request, load]);

  useEffect(() => {
    const preventLoss = (event: BeforeUnloadEvent) => {
      if (Object.values(draftsRef.current).some(dirty)) event.preventDefault();
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, []);

  useEffect(() => {
    if (!deploying) return;
    const interval = setInterval(() => {
      void request("?status=1")
        .then((result) => setJob(result.job))
        .catch((error) => setError(error.message));
    }, 1500);
    return () => clearInterval(interval);
  }, [deploying, request]);

  const select = async (id: string) => {
    setActiveId(id);
    setFilter("");
    setError("");
    setView("edit");
    if (!draftsRef.current[id]) {
      try {
        await load(id);
      } catch (error) {
        setError((error as Error).message);
      }
    }
  };

  const edit = (slot: Slot, value: string) => {
    const current = draftsRef.current[activeId];
    const edits = { ...current.edits, [slot.id]: value };
    if (value === slot.value) delete edits[slot.id];
    const next = { ...current, edits };
    const nextDrafts = { ...draftsRef.current, [activeId]: next };
    draftsRef.current = nextDrafts;
    setDrafts(nextDrafts);
    setNotice("");
    try {
      localStorage.setItem(
        key(activeId),
        JSON.stringify({ revision: current.document.revision, edits }),
      );
    } catch {
      setNotice(
        "Draft storage is full or unavailable. Save locally before leaving this tab.",
      );
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setError("");
    try {
      for (const [id, draft] of Object.entries(draftsRef.current).filter(
        ([, draft]) => dirty(draft),
      )) {
        const { document } = await request("", {
          action: "save",
          id,
          revision: draft.document.revision,
          edits: draft.edits,
        });
        const next = { ...draftsRef.current, [id]: { document, edits: {} } };
        draftsRef.current = next;
        setDrafts(next);
        setEntries((entries) =>
          entries.map((entry) =>
            entry.id === id ? { ...entry, title: document.title } : entry,
          ),
        );
        try {
          localStorage.removeItem(key(id));
        } catch {
          /* the saved file is authoritative */
        }
      }
      setPreviewVersion((value) => value + 1);
      setNotice(
        "Saved to your Markdown files. The public site changes when you deploy.",
      );
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deploy = async () => {
    if (!(await saveAll())) return;
    try {
      const result = await request("", { action: "deploy" });
      setJob(result.job);
      setNotice("");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const reload = async () => {
    if (
      active &&
      dirty(active) &&
      !window.confirm(
        "Discard this file’s unsaved draft and reload its Markdown from disk?",
      )
    )
      return;
    try {
      localStorage.removeItem(key(activeId));
      await load(activeId, true);
      setError("");
      setNotice("Reloaded from disk.");
    } catch (error) {
      setError((error as Error).message);
    }
  };

  const visible =
    active?.document.slots.filter(
      (slot) =>
        !filter ||
        `${slot.label} ${active.edits[slot.id] ?? slot.value}`
          .toLowerCase()
          .includes(filter.toLowerCase()),
    ) ?? [];
  const blockSlots = visible.filter((slot) => slot.kind === "markdown");
  const fields = visible.filter((slot) => slot.kind !== "markdown");
  const renderSlot = (slot: Slot) => (
    <EditBlock
      key={`${activeId}:${slot.id}`}
      slot={slot}
      value={active.edits[slot.id] ?? slot.value}
      onChange={(value) => edit(slot, value)}
      disabled={locked}
    />
  );

  return (
    <div className="studio-shell">
      <aside className="studio-rail">
        <a href="/studio" className="studio-brand">
          chong.md
        </a>
        <p className="studio-edition">
          content editor <span>local</span>
        </p>
        <nav aria-label="Content documents">
          <span className="studio-nav-caption">Pages</span>
          {entries
            .filter((entry) => !entry.id.startsWith("projects/"))
            .map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-current={activeId === entry.id ? "page" : undefined}
                onClick={() => void select(entry.id)}
              >
                {entry.title}
                {drafts[entry.id] && dirty(drafts[entry.id]) ? (
                  <span aria-label="Unsaved changes"> ·</span>
                ) : null}
              </button>
            ))}
          <span className="studio-nav-caption">Projects</span>
          {entries
            .filter((entry) => entry.id.startsWith("projects/"))
            .map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-current={activeId === entry.id ? "page" : undefined}
                onClick={() => void select(entry.id)}
              >
                {entry.title}
                {drafts[entry.id] && dirty(drafts[entry.id]) ? (
                  <span aria-label="Unsaved changes"> ·</span>
                ) : null}
              </button>
            ))}
        </nav>
        <div className="studio-theme">
          <ThemeMenu />
        </div>
        <div className="studio-deploy">
          <button
            type="button"
            onClick={() => void deploy()}
            disabled={locked || !active}
          >
            {busy(job) ? "Deploying…" : "Deploy"}
            <span aria-hidden="true">↗</span>
          </button>
          <p>
            {unsaved
              ? `${unsaved} ${unsaved === 1 ? "file" : "files"} with unsaved edits`
              : "Markdown → main → Vercel"}
          </p>
        </div>
      </aside>
      <main className="studio-main" id="content">
        <header className="studio-toolbar">
          <div>
            <span className="studio-file">content/{activeId}.md</span>
            <h1>
              {entries.find((entry) => entry.id === activeId)?.title ??
                "Content"}
            </h1>
          </div>
          <div className="studio-toolbar-actions">
            <button
              type="button"
              onClick={() => void reload()}
              disabled={locked || !active}
            >
              Reload file
            </button>
            <button
              type="button"
              className="studio-save"
              onClick={() => void saveAll()}
              disabled={locked || !unsaved}
            >
              {saving ? "Saving…" : "Save locally"}
            </button>
          </div>
        </header>
        <div className="studio-controls">
          <div className="studio-tabs" aria-label="Editor view">
            <button
              type="button"
              aria-pressed={view === "edit"}
              onClick={() => setView("edit")}
            >
              Edit blocks
            </button>
            <button
              type="button"
              aria-pressed={view === "preview"}
              onClick={() => setView("preview")}
            >
              Site preview
            </button>
          </div>
          {view === "edit" ? (
            <input
              aria-label="Find a text block"
              placeholder="Find a text block…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          ) : (
            <a
              href={active?.document.route ?? "/"}
              target="_blank"
              rel="noreferrer"
            >
              Open page ↗
            </a>
          )}
        </div>
        {error && (
          <div className="studio-feedback studio-error" role="alert">
            <strong>Changes kept in your draft.</strong>
            <p>{error}</p>
          </div>
        )}
        {notice && (
          <p className="studio-feedback" role="status">
            {notice}
          </p>
        )}
        {job.phase !== "idle" && (
          <div className="studio-feedback" role="status" data-phase={job.phase}>
            <span className="studio-phase">{job.phase}</span>
            <p>{job.message}</p>
            {job.url && (
              <a href={job.url} target="_blank" rel="noreferrer">
                View live website ↗
              </a>
            )}
            {job.commit && <small>commit {job.commit.slice(0, 7)}</small>}
          </div>
        )}
        {!active ? (
          <p role="status">Loading content…</p>
        ) : view === "preview" ? (
          <div className="studio-preview">
            <p>
              {unsaved
                ? "Save locally to include your latest edits in the preview."
                : "The actual website, using your saved Markdown. Draft sections remain marked."}
            </p>
            <iframe
              key={`${activeId}:${previewVersion}`}
              title={`Website preview: ${activeId}`}
              src={`${active.document.route}?studio-preview=${previewVersion}`}
            />
          </div>
        ) : (
          <>
            <p className="studio-intro">
              Click Edit beside any block. Your words stay in Markdown; the
              layout stays in code.
            </p>
            <div className="studio-blocks">{blockSlots.map(renderSlot)}</div>
            <details
              className="studio-fields"
              open={Boolean(filter) || undefined}
            >
              <summary>
                Page fields & metadata <span>{fields.length}</span>
              </summary>
              <p>
                Titles, labels, links, facts and settings shared across the
                website.
              </p>
              {fields.map(renderSlot)}
            </details>
            {!visible.length && <p>No matching blocks.</p>}
          </>
        )}
      </main>
    </div>
  );
}
