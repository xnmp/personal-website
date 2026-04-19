# Deploying `chong.md`

Walkthrough for the remaining steps to get the site live on the `chong.md` domain. Pick this back up once Netim sends the "domain is now active" email.

## Where things stand

- Code: `xnmp/personal-website` on GitHub, `main` branch auto-deploys
- Vercel project: live at `https://personal-website-eight-tan-11.vercel.app/`
- Domain: `chong.md` registered at Netim, awaiting Moldovan registry validation (1-3 business days)
- Once active, every push to `main` will auto-deploy to both the `vercel.app` URL and `chong.md`

## Step 1 - Confirm the domain is active at Netim

1. Log in to https://www.netim.com/en
2. Go to **Domain Names** in the dashboard
3. `chong.md` should show status **Active** (not "Pending" or "Awaiting registry")
4. If it's still pending after 3 business days, open a support ticket with Netim - do not pay again

## Step 2 - Add `chong.md` as a custom domain in Vercel

1. Open the Vercel project: https://vercel.com/dashboard, click into `personal-website`
2. Go to **Settings** -> **Domains**
3. In the "Add a domain" input, type `chong.md` and click **Add**
4. Vercel will ask which deployment branch the domain should serve. Pick **Production** (default - serves the `main` branch).
5. Vercel will then show one of two configurations depending on whether you also want `www.chong.md`:
   - **Apex only (`chong.md`)** - one A record
   - **Apex + www** - one A record + one CNAME

   Recommendation: add **both `chong.md` and `www.chong.md`** so visitors who type either work. To do this, click **Add** again and add `www.chong.md`. Vercel will offer to redirect `www -> apex` (or vice versa) - pick **redirect www to chong.md**.

6. Vercel will display the exact DNS records you need to create. They will look something like:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` (or blank) | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   The IP and CNAME target may differ - **use whatever Vercel actually shows you**, not the values above.

7. Leave the Vercel tab open. You'll see "Invalid Configuration" warnings next to each domain - that's expected until the DNS is in place.

## Step 3 - Add the DNS records at Netim

1. Back in the Netim dashboard, click into the `chong.md` domain
2. Find the **DNS** / **Zone** / **Nameservers** section (Netim's UI sometimes calls it "Glue records" or "Zone management")
3. Make sure the domain is using **Netim's nameservers** (the default). If you ever switched to custom nameservers, switch back.
4. Open the **DNS Zone** editor for `chong.md`
5. **Delete any default A records pointing at Netim's parking page** (they often add one pointing to a "domain registered" placeholder)
6. **Add the records Vercel gave you**:
   - **A record**: Name = `@` (or leave blank, depending on Netim's UI - it means the apex domain `chong.md`). Value = the IP from Vercel. TTL = default (or 3600).
   - **CNAME record**: Name = `www`. Value = the CNAME target from Vercel (e.g. `cname.vercel-dns.com`). TTL = default.
7. Save the zone. Netim usually shows a confirmation that the zone has been updated.

## Step 4 - Wait for DNS propagation

- DNS changes take **5-60 minutes** to propagate globally. Sometimes faster, occasionally up to a few hours.
- You can check progress with:
  ```sh
  dig chong.md +short
  dig www.chong.md +short
  ```
  When `dig chong.md +short` returns the IP Vercel gave you, propagation is done for you.
- Or use https://dnschecker.org/ and paste in `chong.md` to see propagation across the world.
- **In Vercel's Domains settings, the "Invalid Configuration" warning will turn into a green checkmark** the moment Vercel's checker sees the records.

## Step 5 - SSL is automatic

- As soon as Vercel sees the DNS pointing at it, it requests a Let's Encrypt certificate automatically.
- This takes another 30-60 seconds after the green checkmark appears.
- When it's done, https://chong.md will load the site with a valid certificate.

## Step 6 - Verify

```sh
curl -I https://chong.md
curl -I https://www.chong.md
```

You should see `HTTP/2 200` for the apex and `HTTP/2 308` (permanent redirect to apex) for `www`.

Open https://chong.md in a browser. Should see the bare-bones landing page.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `dig chong.md` returns nothing after 1+ hour | Records not saved at Netim, or saved on the wrong zone | Re-check the Netim DNS zone editor; ensure the A record exists at `@` |
| `dig` returns the right IP but Vercel still shows "Invalid Configuration" | Vercel's checker hasn't re-run yet | Click **Refresh** in Vercel's Domains panel, or wait 5 minutes |
| Site loads on `www.chong.md` but not `chong.md` | A record missing or pointing wrong | Verify the apex A record at Netim |
| `chong.md` returns "ERR_SSL_PROTOCOL_ERROR" | Cert not yet issued | Wait 1-2 minutes after the green checkmark, then retry |
| `chong.md` returns Netim's parking page | The default Netim A record is still active | Delete it from the zone editor |
| `chong.md` returns the wrong site | Browser DNS cache | Try incognito or `dig` to confirm DNS is correct |

## After it's live

- Update placeholder links in `src/app/page.tsx`:
  - GitHub URL (currently `https://github.com/`)
  - X URL (currently `https://x.com/`)
  - Email (currently `mailto:hello@chong.md`)
- Push to `main` and the change deploys automatically
- Set Netim auto-renew to **ON** if it isn't already (Domain Names -> chong.md -> Settings)
- Consider setting up an email forwarding service for `you@chong.md` if you want a real address at the domain (Netim offers this, or use a third party like ImprovMX)

## Reference

- Vercel custom domains docs: https://vercel.com/docs/projects/domains
- Netim DNS zone editor docs: https://support.netim.com/en/docs/general-public/domain-name/dns-zone
- DNS propagation checker: https://dnschecker.org/
