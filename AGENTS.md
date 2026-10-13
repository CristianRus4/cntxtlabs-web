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

## Subagents and model choice

- Use subagents sparingly. Spawn one only for genuinely independent work that benefits from running in parallel or in a separate context; do small or sequential tasks directly. Subagents must not spawn further subagents, and keep concurrent agents to a handful so usage limits are not exhausted.
- Set every subagent's model and reasoning effort explicitly to fit its task. Never let a fan-out inherit the main session's model and effort by default.
- Use a smaller, cheaper model (for example Sonnet) for mechanical or read-only work: searching and sweeping files, listing, summarising, doc-versus-code checks, and small edits that follow an exact recipe. Use low reasoning effort for pure search and medium for fact-checking or recipe edits.
- Use the largest model (for example Opus) only where a wrong call is costly: designing a change, persistence, sync, migration or concurrency code, multi-file refactors, adversarial review, and build or release verification. Use high effort by default; go higher only for the hardest verification of data-safety-critical changes.
- When unsure, use the smaller model for discovery and the larger one for the step that edits or verifies.
