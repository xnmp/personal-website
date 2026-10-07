/**
 * Which release build to offer a visitor. Pure: the browser facts come in as
 * arguments, so this runs (and is tested) anywhere.
 */
export type OS = "linux" | "mac" | "windows";

export type Build = {
  os: OS;
  label: string;
  kind: string;
  file: string;
  /** who the build is not for, printed beside the key */
  note?: string;
};

/**
 * The desktop OS a visitor can install on, or null when there is no build
 * for this device (phones, tablets, ChromeOS, ARM Linux) or the agent is
 * unrecognised. iPadOS reports a Mac user agent; no Mac has a touch screen
 * (maxTouchPoints 0), so any touch point means an iPad.
 */
export function osFromUserAgent(ua: string, touchPoints = 0): OS | null {
  if (!ua) return null;
  if (/Android|iPhone|iPad|iPod|CrOS/i.test(ua)) return null;
  if (/Windows NT/i.test(ua)) return /ARM/i.test(ua) ? null : "windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return touchPoints > 0 ? null : "mac";
  if (/Linux|X11/i.test(ua)) return /aarch64|arm/i.test(ua) ? null : "linux";
  return null;
}

/** The release asset for an OS. Names follow the Tauri bundler's output. */
export function buildFor(os: OS, version: string): Build {
  const v = version.replace(/^v/, "");
  switch (os) {
    case "linux":
      return { os, label: "Download for Linux", kind: "AppImage, x86-64", file: `tauri-explorer_${v}_amd64.AppImage` };
    case "mac":
      return {
        os,
        label: "Download for Mac",
        kind: ".dmg, Apple Silicon",
        file: `tauri-explorer_${v}_aarch64.dmg`,
        // browsers report every Mac as Intel, so the key can't tell
        note: "Apple Silicon only; there is no Intel Mac build yet.",
      };
    case "windows":
      return { os, label: "Download for Windows", kind: "setup .exe, x64", file: `tauri-explorer_${v}_x64-setup.exe` };
  }
}

export const assetUrl = (repo: string, version: string, file: string) =>
  `${repo}/releases/download/${version}/${file}`;
