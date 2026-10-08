"use client";

import { useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Key } from "@/components/rack/Key";
import { Screen } from "@/components/rack/Screen";
import { Prop } from "@/components/rack/Prop";
import { APP_THEME, shotFiles } from "./appTheme";
import { withShortcutsFor } from "./shortcuts";
import { useAppTheme } from "./useAppTheme";
import { useOS } from "./useOS";

export type Shot = {
  /** the captured scene (scripts/shot-crops.mjs), in every app theme: its
   * crop, a tighter crop for phones, and the whole window at 1x and 2x */
  scene: string;
  w: number;
  h: number;
  label: string;
  note: string;
  /** On a phone the full window is shown at real size in a panning glass; this
   * is where the glass opens, as fractions of the window's width and height:
   * the top-left corner of the panel the shot is about. */
  focus: { x: number; y: number };
};

/** A plain click opens in place; modified and middle clicks keep the link's own behaviour. */
const opensInPlace = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * Feature crops on screens; each opens the full window in a modal screen on
 * the page (native <dialog>: Esc closes it, focus goes back to the shot).
 * Without JavaScript the links still open the image itself.
 */
export function ShotGallery({ shots, phoneMedia }: { shots: Shot[]; phoneMedia: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<Shot | null>(null);
  const os = useOS();
  const theme = useAppTheme();
  const note = (s: Shot) => withShortcutsFor(s.note, os);
  const files = (s: Shot) => shotFiles(s.scene, theme);

  const open = (s: Shot) => (e: MouseEvent) => {
    if (!opensInPlace(e) || !dialog.current) return;
    e.preventDefault();
    // render the shot before the dialog paints, so it never flashes the previous one
    flushSync(() => setShown(s));
    dialog.current.showModal();
    // On a phone the window is shown at real size inside a panning glass: open
    // it on the panel the shot is about, not on the sidebar.
    const glass = dialog.current.querySelector<HTMLElement>(".screen-face");
    if (glass && glass.scrollWidth > glass.clientWidth) {
      glass.scrollLeft = glass.scrollWidth * s.focus.x;
      glass.scrollTop = glass.scrollHeight * s.focus.y;
    }
  };
  const close = () => dialog.current?.close();

  return (
    <>
      {shots.map((s, i) => (
        // each shot is a print pinned on its own sheet, in a tier of its own:
        // a style whose panels in a row are set level shows a cut of its
        // scene beside it (kit.css .tier-cut); elsewhere the tier is no box
        <div key={s.scene} className="shot-tier">
          {/* the glass takes the crop's own shape (phone crops are all about
              3:2), and on a wide screen the crop's real size (--shot-w, in CSS px) */}
          <figure className="shot faceplate" style={{ "--shot-ar": `${s.w} / ${s.h}`, "--shot-w": s.w / 2 } as CSSProperties}>
            <Prop kind="pin" />
            <a href={files(s).full} className="shot-link" aria-label={`${s.label}: full window`} onClick={open(s)}>
              <Screen>
                {/* one capture per rice, in the app theme that wears it; CSS
                    shows the current rice's, so only it loads (globals.css) */}
                {Object.entries(APP_THEME).map(([rice, t]) => (
                  <picture key={rice} data-rice-shot={rice}>
                    <source media={phoneMedia} srcSet={shotFiles(s.scene, t).phone} />
                    <img
                      src={shotFiles(s.scene, t).crop}
                      alt={`${s.label}: ${note(s)}`}
                      width={s.w}
                      height={s.h}
                      loading="lazy"
                      className="shot-img"
                    />
                  </picture>
                ))}
              </Screen>
            </a>
            <figcaption className="plate-caption">
              <span className="plate-figure-label">
                Fig. {i + 1} · {s.label}
              </span>
              {note(s)}{" "}
              {/* a second pointer target for the shot's own link; one tab stop is enough */}
              <a href={files(s).full} onClick={open(s)} tabIndex={-1} className="shot-full text-action">
                Full window
              </a>
            </figcaption>
          </figure>
          <div className="tier-cut" aria-hidden="true" />
        </div>
      ))}
      <dialog
        ref={dialog}
        className="lightbox"
        aria-label={shown ? `${shown.label}, full window` : "Screenshot"}
        // a click on the dialog box itself (not its contents) is a click on the backdrop
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        {shown ? (
          <div className="lightbox-inner faceplate">
            <Screen>
              {/* eslint-disable-next-line @next/next/no-img-element -- static full-window capture, loaded on open */}
              <img
                src={files(shown).full}
                srcSet={`${files(shown).full} 1600w, ${files(shown).full2x} 2560w`}
                // up to 1180 CSS px on a desktop; at its real 1280 px, panning, on a phone
                sizes="(max-width: 760px) 1280px, min(1180px, 100vw)"
                alt={`${shown.label}, the whole window: ${note(shown)}`}
                width={1600}
                height={1000}
                className="lightbox-img"
              />
            </Screen>
            <div className="lightbox-foot note">
              <span>
                <b className="silk">{shown.label}</b> &nbsp;·&nbsp; {note(shown)}
                <span className="lightbox-pan">Drag to pan.</span>
              </span>
              <Key onClick={close} legend="esc" className="lightbox-close">
                Close
              </Key>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
