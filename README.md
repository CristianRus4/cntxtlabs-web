# cntxtlabs-web

The website for **cntxt**, a software company based in New Zealand.
Lives at [cntxtlabs.co](https://cntxtlabs.co).

## What's here

Plain static HTML, one stylesheet and one small script. No build step, no
dependencies.

```
index.html          the company, the numbers, and a band for each app
about/              who, how and why
contact/            info@cntxtlabs.co
<app>/              one directory per app: what it is, why, download, privacy
img/<app>/          App Store icon and screenshots, as webp
styles.css          the whole design system (see DESIGN.md)
site.js             the behaviour every page shares, loaded with defer
llms.txt            a short index of the site for language models
llms-full.txt       every page in one file, for language models
og/                 one social preview image per page, 1200 by 630
```

Each page's `<head>` also carries a one-line inline script that restores an
appearance chosen in the menu before anything is drawn. It runs before the
stylesheet on purpose.

When a page's copy changes, change `llms-full.txt` to match, and `llms.txt`
if the one-line summary moved.

Each app gets an extensionless URL from its directory: `cntxtlabs.co/left`,
`cntxtlabs.co/txtpod`, and so on.

## The design

After [ia.net](https://ia.net): a slim bar, big bold names, short taglines,
full-width bands that alternate grey and ink, and one pill button per
section. The details are in `DESIGN.md`.

## Working on it

Serve it from the repo root. Opening the files directly won't resolve the
directory URLs.

```bash
python3 -m http.server 8099
```

**All internal links are relative on purpose.** The site has to work both at
`cristianrus4.github.io/cntxtlabs-web/` and at the domain root. A root-absolute
path (`/styles.css`) breaks the first one, so don't add any. The single
exception is `404.html`, which GitHub serves from the site root for any missing
path and therefore carries its own inline styles.

## Deploying

Pushing to `main` runs `.github/workflows/static.yml`, which publishes the repo
root to GitHub Pages.
