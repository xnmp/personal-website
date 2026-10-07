"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { Key } from "@/components/rack/Key";
import { Led } from "@/components/rack/Led";
import { Prop } from "@/components/rack/Prop";
import { Screen } from "@/components/rack/Screen";
import { demoUrl } from "./appTheme";
import { useAppTheme } from "./useAppTheme";
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


/** The web build lays out properly from about 1400 CSS px wide (below that its
 * name column collapses), so it always renders at this size and is scaled to
 * fit the screen. 1440×900 is the screen's own 16:10. */
const DEMO_W = 1440;

/** Boot on its own once most of the screen is in view, where a pointer and
 * keyboard are likely and the screen is wide enough for the app to be read
 * (narrower, it opens full screen instead, as on touch; globals.css). Booting
 * this way leaves focus with the page, so page keys keep working; only an
 * explicit request ("Run it here", Ctrl+P) hands the app the keyboard. */
const AUTO_BOOT = "(hover: hover) and (pointer: fine) and (min-width: 601px)";

/**
 * Ref callback: keep --live-scale equal to screen width / DEMO_W, and boot the
 * demo when it scrolls into view on desktop, unless the visitor is on the
 * demo's own keys (booting would take "Run it here" out from under them).
 */
function mountScreen(el: HTMLDivElement | null) {
  if (!el) return;
  const ro = new ResizeObserver(([entry]) => {
    el.style.setProperty("--live-scale", String(entry.contentRect.width / DEMO_W));
  });
  ro.observe(el);
  const io = new IntersectionObserver(
    ([entry]) => {
      const live = el.closest(`#${DEMO_ANCHOR}`) ?? el;
      if (entry.isIntersecting && window.matchMedia(AUTO_BOOT).matches && !live.contains(document.activeElement)) {
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
 * The working in-browser copy of the app, mounted on its own sheet. The iframe
 * loads only when asked (or when the screen scrolls into view on desktop);
 * until the app paints, the screen shows a still of it in the same theme. The
 * actions sit on the paper under the screen, like every other action on the
 * page. While the app has the keyboard the sheet shows its focus line and the
 * caption says how to take the keyboard back. On touch and phone-width screens
 * the app is too small to use inside the page, so the action opens it full
 * screen in a new tab.
 */
export function LiveSection() {
  const state = useSyncExternalStore(subscribe, demoSnapshot, demoServerSnapshot);
  const appKeys = useSyncExternalStore(subscribe, appKeysSnapshot, appKeysServerSnapshot);
  // The app's web build, in the app theme that wears the rice, so it boots
  // into the same picture as the screens around it; switching the rice
  // reboots it in the new one. Depends on the web build reading ?theme=
  // (website/index.html in the app repo); a build without it ignores the
  // parameter. A theme the visitor picks inside the demo wins.
  const theme = useAppTheme();
  const demo = demoUrl(theme);
  const still = `/tauri/live-app-${theme}.webp`;
  return (
    <section
      className="launch-live faceplate"
      id={DEMO_ANCHOR}
      aria-label="Live demo"
      data-keys={appKeys || undefined}
    >
      <Prop kind="pin" />
      {/* no glare over the running app; the still carries its own */}
      <Screen className="live-screen" glass={false}>
        {/* the still also lies under the iframe, so the screen shows the app
            until the app paints over it, never an empty frame */}
        <div
          className="live-demo"
          data-state={state}
          ref={mountScreen}
          tabIndex={-1}
          style={{ "--live-poster": `url(${still})` } as CSSProperties}
        >
          {state !== "off" ? (
            <iframe
              src={demo}
              title="Tauri Explorer, running in your browser"
              className="live-frame"
              // Out of the Tab order: a demo that booted on scroll would
              // otherwise put the app's 30-odd controls between the hero and
              // the rest of the page. The keyboard goes in on request (Ctrl+P,
              // "Run it here", or "Give it the keyboard"), by focus().
              tabIndex={-1}
              width={DEMO_W}
              height={900}
              allow="clipboard-read; clipboard-write"
              onLoad={(e) => demoLoaded(e.currentTarget)}
            />
          ) : null}
          {state !== "live" ? (
            <div className="live-off">
              {/* eslint-disable-next-line @next/next/no-img-element -- static still, sized by CSS */}
              <img src={still} alt="" className="live-poster" width={1440} height={900} />
              <span className="screen-glass" aria-hidden />
            </div>
          ) : null}
        </div>
      </Screen>
      <div className="launch-live-foot note">
        <span aria-live="polite" role="status">
          {appKeys ? (
            <>
              <Led color="green" on /> <b>The app has the keyboard.</b> Click outside the screen, or Tab
              past the app’s last control, to take it back.
            </>
          ) : state === "booting" ? (
            <>
              <Led color="amber" on blink /> Starting the app…
            </>
          ) : (
            <>
              <b className="silk">Live</b> &nbsp;·&nbsp; the real app’s web build, with a demo folder
            </>
          )}
        </span>
        <span className="live-foot-keys">
          {state === "off" ? (
            <Key tone="signal" onClick={powerOnDemo} className="fine-only">
              Run it here
            </Key>
          ) : null}
          {state === "live" && !appKeys ? (
            <Key onClick={powerOnDemo} className="fine-only">
              Give it the keyboard
            </Key>
          ) : null}
          <Key href={demo} newTab className="fine-only">
            Full screen ↗
          </Key>
          <Key href={demo} newTab tone="signal" className="coarse-only">
            Open the live demo ↗
          </Key>
        </span>
      </div>
    </section>
  );
}
