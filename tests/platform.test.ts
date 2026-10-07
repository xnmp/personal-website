import { describe, expect, test } from "bun:test";
import { assetUrl, buildFor, osFromUserAgent } from "../src/components/launch/platform";

const UA = {
  linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
  linuxArm: "Mozilla/5.0 (X11; Linux aarch64; rv:131.0) Gecko/20100101 Firefox/131.0",
  firefoxUbuntu: "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
  windowsArm: "Mozilla/5.0 (Windows NT 10.0; ARM64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0",
  android: "Mozilla/5.0 (Linux; Android 15; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36",
  iphone: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  chromebook: "Mozilla/5.0 (X11; CrOS x86_64 15359.58.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36",
};

describe("osFromUserAgent", () => {
  test("recognises the three desktop platforms", () => {
    expect(osFromUserAgent(UA.linux)).toBe("linux");
    expect(osFromUserAgent(UA.firefoxUbuntu)).toBe("linux");
    expect(osFromUserAgent(UA.mac)).toBe("mac");
    expect(osFromUserAgent(UA.windows)).toBe("windows");
  });

  test("offers no build where none would install", () => {
    expect(osFromUserAgent(UA.android)).toBeNull(); // says "Linux" too
    expect(osFromUserAgent(UA.iphone)).toBeNull(); // says "Mac OS X" too
    expect(osFromUserAgent(UA.chromebook)).toBeNull(); // says "X11" too
    expect(osFromUserAgent(UA.linuxArm)).toBeNull(); // the AppImage is x86-64
    expect(osFromUserAgent(UA.windowsArm)).toBeNull();
  });

  test("an iPad asking for the desktop site is not a Mac", () => {
    expect(osFromUserAgent(UA.mac, 5)).toBeNull();
    expect(osFromUserAgent(UA.mac, 1)).toBeNull(); // what an emulated iPad reports
    expect(osFromUserAgent(UA.mac, 0)).toBe("mac");
  });

  test("empty, unknown or absurdly long agents fall back to the release page", () => {
    expect(osFromUserAgent("")).toBeNull();
    expect(osFromUserAgent("curl/8.9.1")).toBeNull();
    expect(osFromUserAgent("x".repeat(100_000))).toBeNull();
  });
});

describe("buildFor", () => {
  test("names the asset the release actually ships, with or without the v prefix", () => {
    expect(buildFor("linux", "v1.11.2").file).toBe("tauri-explorer_1.11.2_amd64.AppImage");
    expect(buildFor("mac", "1.11.2").file).toBe("tauri-explorer_1.11.2_aarch64.dmg");
    expect(buildFor("windows", "v1.11.2").file).toBe("tauri-explorer_1.11.2_x64-setup.exe");
  });

  test("links to the pinned release, not latest, so the name and version agree", () => {
    expect(assetUrl("https://github.com/o/r", "v1.11.2", "a.dmg")).toBe(
      "https://github.com/o/r/releases/download/v1.11.2/a.dmg"
    );
  });
});
