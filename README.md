# Cleveland County 4-H Foundation — Website

The public website for the Cleveland County 4-H Foundation, meant to live at **ccok4h.org**.

It's a single static page — no build step, no framework, no database. Just `index.html` plus images in `assets/`.

## Files

| File | What it is |
|------|-----------|
| `index.html` | The main website |
| `donate.html` | Focused giving page — **ccok4h.org/donate** |
| `alumni.html` | Alumni reconnect/enroll form — **ccok4h.org/alumni** |
| `join.html` | Donor-list enroll form — **ccok4h.org/join** |
| `admin.html` | Private organizer view — **ccok4h.org/admin** |
| `assets/emblom.svg` | Official 4-H emblem used as the logo |
| `assets/pages.css` | Shared styling for the donate/alumni/join pages |
| `assets/form.js` | Shared enrollment-form handler (posts to `/api/join`) |
| `assets/favicon.png` | Browser-tab icon (4-H clover) |
| `assets/og-image.png` | Preview image shown when a link is shared on Facebook/text |

Cloudflare Pages serves these at clean URLs (no `.html`), e.g. `/donate`, `/alumni`, `/join`.

## Deploying with Cloudflare Pages

This repo is meant to be connected to **Cloudflare Pages**, which redeploys automatically every time we push a change to GitHub.

One-time setup (in the Cloudflare dashboard):

1. Go to **dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git**.
2. Pick this GitHub repository.
3. Build settings — leave them empty:
   - **Framework preset:** None
   - **Build command:** *(blank)*
   - **Build output directory:** `/`
4. Click **Save and Deploy**. You'll get a temporary `*.pages.dev` link in about a minute.

Connecting the domain **ccok4h.org**:

5. In the new Pages project → **Custom domains → Set up a custom domain** → enter `ccok4h.org`.
6. Follow Cloudflare's prompt to point the domain (easiest if the domain's DNS is already on Cloudflare).

After that, every future change is just: edit → push to GitHub → it goes live on its own.

## Donor list backend (Cloudflare D1)

The "Join our donor list" buttons open a sign-up form that saves straight into a
**Cloudflare D1 database** — no Google Form, no third-party service.

- `functions/api/join.js` — receives a signup (POST) and stores it. The tables are
  created automatically on first use.
- `functions/api/admin.js` — first-run account setup, login, and CSV/JSON export.
  The admin username + a PBKDF2 hash of the password are stored in the database (never plain text).
- `admin.html` — private organizer page at **/admin.html**.

### One-time setup in the Cloudflare dashboard

1. **Create the database:** Storage & Databases → **D1** → **Create** → name it `ccok4h-donors`.
2. **Bind it to the site:** Workers & Pages → `ccok4h-website` → **Settings → Bindings** (or
   *Functions*) → **Add → D1 database** → Variable name **`DB`** → select `ccok4h-donors`.
3. **Redeploy** (Deployments → Retry deployment) so the binding takes effect.

No environment variables or secrets to configure — the admin password is set from the web page.

### Seeing the signups

Go to **ccok4h.org/admin.html**. The **first** visit asks you to create the organizer
account (username + password) — that first account becomes the admin. After that, the page
just asks you to sign in, and you can view every signup or download the list as a CSV.

## Still to wire up

- **Contact email** in the footer.
- **EIN**, if it should be printed (currently shown as "available on request").
- **Official logo:** the header/footer use a faithful SVG recreation of the 4-H clover.
  To use the exact official emblem, drop the artwork in `assets/` and swap the `<svg>` for an `<img>`.
