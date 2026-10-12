# Working on cntxtlabs-web

- Work directly on `main`. No branches, no worktrees. Commit and push to
  `main` when a change is ready: pushing deploys it to cntxtlabs.co through
  `.github/workflows/static.yml`.
- Read `README.md` and `DESIGN.md` first. Keep every internal link relative.
- When page copy changes, update `llms-full.txt` to match, `llms.txt` if a
  one-line summary moved, and `sitemap.xml` lastmod for that page.
- A new app page follows the others: bar with the app name, hero (icon,
  name, tagline, buttons), screenshot strip, prose. It needs its icon and
  screenshots in `img/<slug>/`, a `qr.svg` of its App Store link
  (https://apps.apple.com/app/id<ID>, checked to scan), its own `og/<slug>.png` (1200 by 630, in the
  style of the others), and a band on the home page.
- The layout follows ia.net; see `DESIGN.md` before changing it.
- Copy is plain, professional NZ English, written about what each app is
  and why it exists rather than a list of features. No em dashes.
