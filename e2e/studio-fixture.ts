import type { Locator, Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { documentSlots, editDocument, previewRoute } from "../src/lib/studio/document";

export async function openField(scope: Page | Locator, label: string) {
  await scope.getByRole("button", { name: `Edit ${label}`, exact: true }).click();
  return scope.getByRole("textbox", { name: label, exact: true });
}

/** Keep editor tests safe for an editor containing the owner's unsaved work. */
export async function interceptSaves(page: Page, holdFirst = false) {
  const sources = new Map<string, string>();
  const requests: { action: string; id?: string }[] = [];
  let release = () => {};
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/studio", async route => {
    if (route.request().method() !== "POST") return route.continue();
    const body = route.request().postDataJSON();
    requests.push(body);
    if (body.action !== "save") return route.fulfill({ status: 400, json: { error: "Only local saves are allowed in this test" } });
    const original = sources.get(body.id) ?? await readFile(`content/${body.id}.md`, "utf8");
    const source = editDocument(original, body.edits);
    sources.set(body.id, source);
    if (holdFirst && requests.length === 1) await gate;
    return route.fulfill({ json: { document: {
      id: body.id, title: body.id, route: previewRoute(body.id), source,
      revision: createHash("sha256").update(source).digest("hex"), slots: documentSlots(source),
    } } });
  });
  return { sources, requests, release };
}
