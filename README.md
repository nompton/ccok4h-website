# Cleveland County 4-H Foundation — Website

The public website for the Cleveland County 4-H Foundation, meant to live at **ccok4h.org**.

It's a single static page — no build step, no framework, no database. Just `index.html` plus images in `assets/`.

## Files

| File | What it is |
|------|-----------|
| `index.html` | The whole website |
| `assets/favicon.png` | Browser-tab icon (4-H clover) |
| `assets/og-image.png` | Preview image shown when the link is shared on Facebook/text |

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

## Still to wire up

- **"Join Our Donor List" buttons** currently scroll to the sign-up section (a Google Form link will be dropped in).
- **Contact email** in the footer.
- **EIN**, if it should be printed (currently shown as "available on request").
