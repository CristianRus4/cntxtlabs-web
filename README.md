# cntxtlabs-web

The website for **cntxt** — a studio in Wellington, New Zealand building iOS apps
and websites. Lives at [cntxtlabs.co](https://cntxtlabs.co).

## What's here

Plain static HTML and one stylesheet. No build step, no dependencies.

```
index.html          the company, and the list of apps
contact/            info@cntxtlabs.co
<app>/              one directory per app — description, download, privacy policy
styles.css          the whole design system
```

Each app gets an extensionless URL from its directory: `cntxtlabs.co/left`,
`cntxtlabs.co/txtpod`, and so on.

## Working on it

Serve it from the repo root — opening the files directly won't resolve the
directory URLs.

```bash
python3 -m http.server 8080
```

**All internal links are relative on purpose.** The site has to work both at
`cristianrus4.github.io/cntxtlabs-web/` and at the domain root. A root-absolute
path (`/styles.css`) breaks the first one, so don't add any.

## Deploying

Pushing to `main` runs `.github/workflows/static.yml`, which publishes the repo
root to GitHub Pages. Pages source must be set to **GitHub Actions** in
Settings → Pages.
