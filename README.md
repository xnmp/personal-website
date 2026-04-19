# chong.md

A lab-notebook-style passions site. Each project is one index card and one detail page. Built with Next.js 16 + React 19, hosted on Vercel.

Live: [chong.md](https://chong.md) (pending DNS) · fallback: [personal-website-eight-tan-11.vercel.app](https://personal-website-eight-tan-11.vercel.app)

## Develop

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # production build
bun run lint
```

## Structure

```
src/
  app/
    page.tsx                  # notebook index
    p/<slug>/page.tsx         # project detail pages
    layout.tsx                # fonts, metadata
    globals.css               # all styling
    icon.png / apple-icon.png # auto-wired favicons
    opengraph-image.png       # auto-wired OG
  components/
    notebook/                 # shared presentational primitives
    demos/                    # per-project diagrams/demos
public/bg/                    # watercolor backgrounds
scripts/resize.mjs            # sharp-based image resizer
docs/
  architecture.md             # component layers, styling, palette, adding entries
  deploy-chong-md.md          # domain + Vercel setup walkthrough
```

See [`docs/architecture.md`](docs/architecture.md) for the component system, styling strategy, and how to add a new entry.

## Deploy

Production deploys automatically on push to `main`.

```bash
git push origin main
```

Vercel rebuilds and publishes. Deploy status is reported as a GitHub commit check.

### First-time setup (done)

- Vercel project `personal-website` connected to `xnmp/personal-website`, branch `main`
- `main` deploys to production, all other branches get preview URLs
- `metadataBase` in `src/app/layout.tsx` is set to `https://chong.md` so OG/Twitter image URLs resolve absolutely

### Custom domain (pending Netim activation)

Full walkthrough in [`docs/deploy-chong-md.md`](docs/deploy-chong-md.md). Summary:

1. Wait for Netim to mark `chong.md` Active.
2. Vercel dashboard → `personal-website` → Settings → Domains → add `chong.md` and `www.chong.md` (redirect www → apex).
3. Copy the DNS records Vercel shows into Netim (A record for apex, CNAME for www).
4. Wait for SSL provisioning (~60s after DNS propagates).

### Rolling back a bad deploy

Vercel keeps every build. Dashboard → Deployments → pick a previous green one → **Promote to Production**. No git revert needed.

## Image generation

Background art is generated offline via the Gemini image API (model `gemini-3-pro-image-preview`) and committed to the repo. See [`docs/architecture.md`](docs/architecture.md) for the pipeline. Raw outputs go to `/tmp/gen-images/`, resized with `scripts/resize.mjs`, shipped into `public/bg/` or `src/app/`.

## License

All rights reserved.
