# chong.md

A rack of the things I build. Each project is a module (an authored faceplate with a lit screen) and one detail page. Built with Next.js 16 + React 19, hosted on Vercel. Art direction: [`art/BRIEF.md`](art/BRIEF.md).

Live: [chong.md](https://chong.md) (pending DNS) · fallback: [personal-website-eight-tan-11.vercel.app](https://personal-website-eight-tan-11.vercel.app)

## Develop

```bash
bun install
bun run dev      # http://localhost:3000
bun run build    # production build
bun run lint
bun run test     # unit (bun:test)
bun run e2e      # playwright, reuses the dev server
bun run og       # re-capture the social cards (dev server must be running)
bun run kit:check  # every kit state registers with its normal state
```

## Structure

See [`docs/architecture.md`](docs/architecture.md) for routes, the two colour-token families, the raster kit and the image pipeline.

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

All art is generated offline (Gemini `gemini-3-pro-image-preview`), keyed, dithered and committed under `public/`. Prompts for every shipped asset are in `art/prompts/`. The pipeline is in [`docs/architecture.md`](docs/architecture.md#image-pipeline).

## License

All rights reserved.
