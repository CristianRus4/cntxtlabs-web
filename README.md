# cntxtlabs-web

The website for **cntxt**, a software company based in New Zealand.
Lives at [cntxtlabs.co](https://cntxtlabs.co).

## What's here

Plain static HTML and one stylesheet. No build step, no dependencies.

```
index.html          about, and the list of apps
contact/            info@cntxtlabs.co
<app>/              one directory per app: description, download, privacy
styles.css          the whole design system
```

Each app gets an extensionless URL from its directory: `cntxtlabs.co/left`,
`cntxtlabs.co/txtpod`, and so on.

## The design

Lifted from cristianrus.me: grey body text on off-white, near-black for
headings and links, everything at one font size with weight carrying the
hierarchy. Links have no underline until you hover. Nothing is dimmed with
opacity.

Hovering the wordmark puts the vowels back: `cntxt` becomes `context`.

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
