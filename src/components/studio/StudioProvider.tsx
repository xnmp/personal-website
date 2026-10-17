"use client";

import type { ReactNode } from "react";
import { StudioContext } from "./StudioContext";
import { useStudioController } from "./useStudioController";
import "./studio.css";

export function StudioProvider({
  token,
  children,
}: {
  token: string;
  children: ReactNode;
}) {
  const studio = useStudioController(token);
  const message =
    studio.error ||
    studio.notice ||
    (studio.job.phase !== "idle" ? studio.job.message : "");
  return (
    <StudioContext.Provider value={studio.context}>
      {children}
      <aside
        className="studio-dock"
        aria-label="Local content editor"
        data-editing={studio.editing || undefined}
      >
        {message && (
          <div
            className="studio-message"
            role={studio.error ? "alert" : "status"}
          >
            <span>{message}</span>
            {studio.job.phase === "live" && studio.job.url && (
              <a href={studio.job.url} target="_blank" rel="noreferrer">
                Open site ↗
              </a>
            )}
            {studio.error && studio.unsaved > 0 && (
              <button
                type="button"
                onClick={studio.discard}
                disabled={studio.locked}
              >
                Discard unsaved edits
              </button>
            )}
          </div>
        )}
        <div
          className="studio-toolbar"
          role="toolbar"
          aria-label="Editing and deployment"
        >
          <button
            type="button"
            className="studio-deploy"
            disabled={!studio.ready || studio.locked}
            onClick={() => void studio.save(true)}
          >
            {studio.locked
              ? studio.saving
                ? "Saving…"
                : "Deploying…"
              : "Deploy"}
          </button>
          <button
            type="button"
            disabled={!studio.ready || studio.locked || !studio.unsaved}
            onClick={() => void studio.save()}
            aria-label="Save locally"
          >
            Save{studio.unsaved ? ` · ${studio.unsaved}` : ""}
          </button>
          <button
            type="button"
            className="studio-edit-status"
            aria-pressed={studio.editing}
            aria-live="polite"
            aria-keyshortcuts="Control+E Meta+E"
            disabled={!studio.ready || studio.locked}
            onClick={studio.toggleEditing}
            title="Toggle editing (Ctrl+E / Cmd+E)"
          >
            <span className="studio-edit-status-dot" aria-hidden />
            {studio.editing ? "Editing on" : "Editing off"}
          </button>
        </div>
      </aside>
    </StudioContext.Provider>
  );
}
