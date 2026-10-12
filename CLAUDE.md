# Working on cntxtlabs-web

- Work directly on `main`. No branches, no worktrees. Commit and push to
  `main` when a change is ready: pushing deploys it to cntxtlabs.co through
  `.github/workflows/static.yml`.
- Read `README.md` and `DESIGN.md` first. Keep every internal link relative.
- When page copy changes, update `llms-full.txt` to match, `llms.txt` if a
  one-line summary moved, and `sitemap.xml` lastmod for that page.
- The layout is the classic text one: one type size, weight for hierarchy,
  a 600px column. Keep it. An ia.net-style layout was tried and lives on
  the `neue-layout` branch for reference; do not bring it to `main`.
- A new app page needs a `qr.svg` of its App Store link in `img/<slug>/`
  (https://apps.apple.com/app/id<ID>, checked to scan) and its own
  `og/<slug>.png` (1200 by 630, in the style of the others).
- Copy is plain, professional NZ English, written about what each app is
  and why it exists rather than a list of features. No em dashes.
