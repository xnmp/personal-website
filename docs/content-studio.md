# Local content editor

```sh
bun install
bun run dev
```

Open **http://127.0.0.1:3210**. `STUDIO_PORT=3211 bun run dev` chooses another port. `bun run studio` remains an alias. The process binds to loopback and uses the same Next application, Margin Index CSS, fonts, Markdown renderer and source content as the public website. `bun run dev:site` starts a plain site preview at http://localhost:3000 for development and browser tests.

The editor opens the **actual website**. Navigate its usual pages and links; there is no separate preview or editing layout. The only added interface is the small editing/deployment dock at the bottom-left.

The editor starts with **Editing off**. Press **Ctrl+E** (Cmd+E on Mac), or click the status indicator in the bottom-left dock, to toggle editing. Pencil badges appear on editable text only while editing is on.

Click authored text, or focus its pencil target and press Enter, to edit it in place. Each paragraph edits separately. Text keeps its rendered font, position, links and formatting while focused; edits are written back to the corresponding Markdown text. Shared `{{field}}` values and platform-specific helpers stay intact. Click outside or press Ctrl/Cmd+Enter to finish. Enter also finishes single-line fields; Escape cancels the current edit. Turn editing off to follow text links normally (Ctrl/Cmd-click also follows links while editing). Formatting syntax, link destinations and structural changes can be edited in the Markdown files.

**Save** writes all edited files to `content/`. **Deploy** saves pending edits and publishes them. Browser drafts are recovered after reload, including drafts from other pages. A concurrent file edit reports a conflict and keeps your draft; copy your edits, then use **Discard unsaved edits** and reload to reconcile with disk. Adding/removing sections or projects, metadata that is not displayed, image paths and structural settings are still edited in Markdown/code.

Development pages include labelled About drafts; production omits `draft: true` sections and facts. Normal development and the deployed site have no editing interface.

## Deploy

The **Deploy** button remains at the bottom-left. It saves pending edits, validates every content document, fetches main, and creates a temporary checkout under ignored `.content-studio/builds/` containing the latest main plus only changed Markdown. It installs frozen dependencies inside that checkout and runs a production build (`NODE_ENV=production`, editor disabled), then commits just those content paths and pushes normally to main. An unrelated local branch, staged files, code changes and untracked assets are never included. A failed build or non-fast-forward push leaves local content intact.

Git and GitHub CLI use the machine's existing credentials; the browser receives no GitHub/Vercel credential. The configured remote is restricted to `xnmp/personal-website`. Pushing main triggers the existing GitHub → Vercel integration. Progress distinguishes validation, build, push, deployment and confirmed live production. The live link appears only after the exact commit's Vercel check and Production deployment succeed. A failed or delayed deployment reports its preserved commit; retry checks already-published content without duplicating the commit.

Per-file published baselines are stored in ignored `.content-studio/published.json`. They survive editor restarts and unrelated code commits. A newer remote edit to an untouched file is preserved; editing that stale local file later reports a conflict instead of overwriting main. To reconcile, copy your desired changes, update the local file from main, then reload it in the editor. Saving locally does not move or reset your checkout/index.

An operation lock prevents overlapping writes or deployment snapshots. If the editor process is killed, starting `bun run dev` recovers the lock after confirming the previous owner process died. Active process locks remain intact. Keep the editor running while deployment completes.

The editor and API require the launcher's development opt-in, loopback Host/Origin and a per-run session token. They return 404 in the plain site preview, production and Vercel even if `CONTENT_STUDIO=1` is accidentally set. Do not expose this local development process through a public tunnel.

## Verification

```sh
bun test tests/
STUDIO_E2E=1 E2E_BASE_URL=http://127.0.0.1:3210 bunx playwright test e2e/studio.e2e.ts --workers=1
```

The browser tests temporarily edit local home/About/project files and restore their exact original sources in `finally`. Deploy requests are intercepted. Publish behavior tests use a temporary repository and fake remote; they never push to GitHub.
