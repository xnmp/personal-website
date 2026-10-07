"use client";

import { useSyncExternalStore } from "react";
import { Key } from "@/components/rack/Key";
import { Led } from "@/components/rack/Led";
import { Screen } from "@/components/rack/Screen";
import {
  appKeysServerSnapshot,
  appKeysSnapshot,
  bootDemo,
  DEMO_ANCHOR,
  demoLoaded,
  demoServerSnapshot,
  demoSnapshot,
  powerOnDemo,
  subscribe,
} from "./keyboard";

/** The app's web build, in its dark theme: every screen on the site is dark
 * glass and the standby poster is the dark app, so the demo boots into the
 * same picture. Depends on the web build reading ?theme= (website/index.html
 * in the app repo); a build without it ignores the parameter and follows the
 * visitor's OS, as before. A theme the visitor picks inside the demo wins. */
export const DEMO = "https://tauri-explorer.vercel.app/?theme=dark";

/** The web build lays out properly from about 1400 CSS px wide (below that its
 * name column collapses), so it always renders at this size and is scaled to
 * fit the screen. 1440×900 is the screen's own 16:10. */
const DEMO_W = 1440;

/** Boot on its own once most of the screen is in view, where a pointer and
 * keyboard are likely. Booting this way leaves focus with the page, so page
 * keys keep working; only an explicit power-on hands the app the keyboard. */
const AUTO_BOOT = "(hover: hover) and (pointer: fine)";

/**
 * Ref callback: keep --live-scale equal to screen width / DEMO_W, and boot the
 * demo when it scrolls into view on desktop, unless the visitor is on the
 * power key (booting would take the key out from under them).
 */
function mountScreen(el: HTMLDivElement | null) {
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    el.style.setProperty("--live-scale", String(entry.contentRect.width / DEMO_W));
  });
  ro.observe(el);
  const io = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && window.matchMedia(AUTO_BOOT).matches && !el.contains(document.activeElement)) {
        bootDemo();
        io.disconnect();
      }
    },
    { threshold: 0.5 }
  );
  io.observe(el);
  return () => {
    ro.disconnect();
    io.disconnect();
  };
}

/**
 * The working in-browser copy of the app, behind a power switch, on its own
 * plate. The iframe loads only when asked (or when the screen scrolls into view
 * on desktop); until it has loaded the glass keeps the dimmed frame with an
 * amber "booting" lamp. While the app has the keyboard the plate shows its
 * focus line and the caption says how to take the keyboard back. On touch
 * screens the app is too small to use inside the page, so the key opens it
 * full screen in a new tab.
 */
export function LiveSection() {
  const state = useSyncExternalStore(subscribe, demoSnapshot, demoServerSnapshot);
  const appKeys = useSyncExternalStore(subscribe, appKeysSnapshot, appKeysServerSnapshot);
  return (
    <section
      className="launch-live faceplate"
      id={DEMO_ANCHOR}
      aria-label="Live demo"
      data-keys={appKeys || undefined}
    >
      <Screen className="live-screen">
        <div className="live-demo" data-state={state} ref={mountScreen} tabIndex={-1}>
          {state !== "off" ? (
            <iframe
              src={DEMO}
              title="Tauri Explorer, running in your browser"
              className="live-frame"
              // Out of the Tab order: a demo that booted on scroll would
              // otherwise put the app's 30-odd controls between the hero and
              // the rest of the page. The keyboard goes in on request (Ctrl+P,
              // the power key, or "Give it the keyboard"), by focus().
              tabIndex={-1}
              width={DEMO_W}
              height={900}
              allow="clipboard-read; clipboard-write"
              onLoad={(e) => demoLoaded(e.currentTarget)}
            />
          ) : null}
          {state !== "live" ? (
            <div className="live-off">
              {/* eslint-disable-next-line @next/next/no-img-element -- static poster, sized by CSS */}
              <img src="/tauri/live-standby.webp" alt="" className="live-poster" width={1440} height={900} />
              <span className="live-standby" role="status">
                {state === "booting" ? (
                  <>
                    <Led color="amber" on blink /> booting
                  </>
                ) : (
                  <>
                    <Led color="amber" on /> standby
                  </>
                )}
              </span>
              {state === "off" ? (
                <>
                  <Key tone="signal" size="lg" onClick={powerOnDemo} className="fine-only">
                    Power on the live demo
                  </Key>
                  <Key href={DEMO} newTab tone="signal" size="lg" className="coarse-only">
                    Open the live demo ↗
                  </Key>
                </>
              ) : null}
              <span className="screen-glass" aria-hidden />
            </div>
          ) : null}
        </div>
      </Screen>
      <div className="launch-live-foot note">
        <span aria-live="polite">
          {appKeys ? (
            <>
              <Led color="green" on /> <b>The app has the keyboard.</b> Click outside the screen, or Tab
              past the app’s last control, to take it back.
            </>
          ) : (
            <>
              <b className="silk">Live</b> &nbsp;·&nbsp; the real app’s web build, with a demo folder
            </>
          )}
        </span>
        {state === "live" && !appKeys ? (
          <button type="button" className="live-give fine-only" onClick={powerOnDemo}>
            Give it the keyboard
          </button>
        ) : null}
        {/* on touch the power key already is this link */}
        <a href={DEMO} className="fine-only" target="_blank" rel="noopener">
          open full screen ↗
        </a>
      </div>
    </section>
  );
}
