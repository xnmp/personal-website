# Local content editor

```sh
bun install
bun run studio
```

Open **http://127.0.0.1:3210/studio**. `STUDIO_PORT=3211 bun run studio` chooses another port. The process binds to loopback and uses the same Next application, Margin Index CSS, fonts, Markdown renderer and source content as the public website.

Choose a page or project from the left rail. Each named Markdown block has an **Edit** button; **Page fields & metadata** contains titles, labels, facts, links, descriptions, captions and existing scalar settings. The editor preserves block identities and structured frontmatter; adding/removing sections or projects still happens in Markdown/code. Existing inline directives and `{{field}}` references can be kept in block text.

**Done** closes a field's textarea. **Save locally** writes all edited files to `content/`. Browser drafts are recovered after reload, including drafts from other pages. **Reload file** deliberately discards that file's unsaved browser draft. A concurrent file edit fails with a conflict and keeps your draft; copy the draft, reload the file and reconcile it before saving.

**Site preview** embeds the actual existing page, using saved Markdown and the actual layouts/components. Reload after manual external edits. Development previews include labelled About drafts; production omits `draft: true` sections and facts.

## Deploy

The **Deploy** button remains at the bottom-left. It saves pending edits, validates every content document, fetches main, and creates a temporary checkout under ignored `.content-studio/builds/` containing the latest main plus only changed Markdown. It installs frozen dependencies inside that checkout and runs a production build (`NODE_ENV=production`, editor disabled), then commits just those content paths and pushes normally to main. An unrelated local branch, staged files, code changes and untracked assets are never included. A failed build or non-fast-forward push leaves local content intact.

Git and GitHub CLI use the machine's existing credentials; the browser receives no GitHub/Vercel credential. The configured remote is restricted to `xnmp/personal-website`. Pushing main triggers the existing GitHub → Vercel integration. Progress distinguishes validation, build, push, deployment and confirmed live production. The live link appears only after the exact commit's Vercel check and Production deployment succeed. A failed or delayed deployment reports its preserved commit; retry checks already-published content without duplicating the commit.

Per-file published baselines are stored in ignored `.content-studio/published.json`. They survive editor restarts and unrelated code commits. A newer remote edit to an untouched file is preserved; editing that stale local file later reports a conflict instead of overwriting main. To reconcile, copy your desired changes, update the local file from main, then reload it in the editor. Saving locally does not move or reset your checkout/index.

An operation lock prevents overlapping writes or deployment snapshots. If the editor process is killed, starting `bun run studio` recovers the lock after confirming the previous owner process died. Active process locks remain intact. Keep the editor running while deployment completes.

The editor and API require explicit development opt-in, the launcher's loopback Host/Origin and a per-run session token. They return 404 in normal development, production and Vercel even if `CONTENT_STUDIO=1` is accidentally set. Do not expose this local development process through a public tunnel.

## Verification

```sh
bun test tests/studio.test.ts tests/content.test.tsx tests/about.test.ts tests/projects.test.ts
STUDIO_E2E=1 E2E_BASE_URL=http://127.0.0.1:3210 bunx playwright test e2e/studio.e2e.ts --workers=1
```

The browser tests temporarily edit local home/About/project files and restore their exact original sources in `finally`. Deploy requests are intercepted. Publish behavior tests use a temporary repository and fake remote; they never push to GitHub.
