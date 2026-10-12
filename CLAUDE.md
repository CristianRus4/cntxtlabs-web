# Working on cntxtlabs-web

- Work directly on `main`. No branches, no worktrees. Commit and push to
  `main` when a change is ready: pushing deploys it to cntxtlabs.co through
  `.github/workflows/static.yml`.
- Read `README.md` and `DESIGN.md` first. Keep every internal link relative.
- When page copy changes, update `llms-full.txt` to match, `llms.txt` if a
  one-line summary moved, and `sitemap.xml` lastmod for that page.
- A new product page needs its own `og/<slug>.png` (1200 by 630, in the
  style of the others) and a Next row.
