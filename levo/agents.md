# Levo, for agents

Levo is a Mac menubar app by Cntxt Labs. This file is for a coding agent that has been asked to install, explain or remove it. People can read it too. Page: https://cntxtlabs.co/levo

## What Levo is

- A menubar app that watches disk, memory, CPU and GPU against thresholds the user sets.
- When something runs high, the user's own agent CLI has already looked. Levo shows what is safe to clean or quit, with sizes and reasons.
- Levo cleans only what the user ticks, or, in Auto mode, keeps free space above the user's limit on its own.
- No Levo account and no Levo server.

## How Levo uses your agent

- Levo starts the user's chosen agent CLI in the background. The CLI does not need to be open.
- It runs on the user's own plan or API key. Each run is capped in time and turns, and the number of runs per day is capped.
- Every run is wrapped in the macOS sandbox. Writes are denied everywhere except Levo's run folder, the CLI's own state folders and the temp folder. Protected folders cannot be read. The network stays open so the agent can reach its model. The CLI's own read-only flags are added on top.
- The agent talks to Levo only through Levo's MCP server (`levo-mcp`).
  - Read-only "eyes" tools: `index_summary`, `largest`, `list`, `file_info`, `git_status`, `open_files`, `processes`, `process_info` and `agent_activity`.
  - One answer tool: `submit_findings`, which is schema-checked.
  - There is no tool that deletes, quits, or changes settings or the licence.
- Agent output is data, never instructions. A file name that tells the agent to delete something changes nothing.
- Supported presets: Claude Code, Codex, Gemini CLI (Antigravity CLI), Cursor CLI, GitHub Copilot CLI, opencode (which runs many providers, including Qwen, Kimi, DeepSeek and GLM), Qwen Code, Kimi CLI and Grok CLI.
- A custom command is also supported: the user types any CLI with `{prompt_file}` and `{mcp_config}` placeholders. Without MCP, the CLI prints a JSON block between markers, which Levo parses.

## Why it is safe

The guard runs when Levo analyses and again right before it acts.

- Never touched: Photos, the Mail store, Messages, iCloud Drive, Keychains, `~/.ssh`, `~/.gnupg`, `.env` and credential files, `/System`, app bundles, lone `.git` folders, and any folder the user has protected.
- In use: open files or a process working directory under the path, or the owning app running.
- Git: a worktree that is dirty, unmerged or locked is never removed. Clean ones go through `git worktree remove`.
- Recent activity: anything changed within the user's recent-activity window, or touched by a coding agent's session, is left alone.

Levo also verifies every finding the agent submits: the path exists, sits inside an indexed root and is not protected; it does not escape through a symlink; its size is measured again. Rejected findings are dropped.

Cleaning:

- Only what the user ticks is cleaned. The exception is Auto mode: when free space drops below the user's limit, Levo cleans the categories the user chose for it, with no click, then says what it freed. Auto mode is off by default and needs an acknowledgement.
- Levo uses the tool's official clean command first. Items that can be regenerated are removed. Everything else goes to the Trash.
- A journal records every action, and anything trashed can be undone.
- The licence is checked inside the delete path itself. Deleting is reachable only from a click in the confirm step or from Auto mode. No URL scheme, AppleScript, CLI or MCP tool can trigger it.

Privacy:

- No account and no server. Only the licence check leaves the Mac.
- The agent's provider sees what the agent reads. That is the user's own choice of agent.

## What it needs

- macOS 26 or later.
- For suggestions, any agent CLI installed and signed in.
- Full Disk Access is recommended. Without it, Levo skips, and does not watch, protected areas such as Mail and other apps' containers.
- A licence, for Clean and Auto mode only. Monitoring, the index, analysis, suggestions and Quit are free.

## Price

A lifetime licence for 2 Macs, currently US$4.99, bought through Polar.

## Install (for an agent)

1. Download Levo from `https://github.com/CristianRus4/cntxtlabs-web/releases/download/levo-v2026.11/Levo.dmg`.
2. Check that it is signed and notarised by Cntxt Labs: run `spctl -a -vv /path/to/Levo.app`. The output must show `source=Notarized Developer ID` and `origin=Developer ID Application: … (5X94H5ZCD4)`. The team ID is `5X94H5ZCD4`. If it does not match, stop and tell the user.
3. Move `Levo.app` to `/Applications` and open it.
4. Tell the user to finish Levo's welcome window themselves. Permissions and the choice of agent are theirs.
5. Change nothing else: no settings, no other files, no cleaning.

If the download is a DMG, mount it, copy the app out, then unmount it with `hdiutil`. If it is a zip, extract it with `ditto -x -k`.

## Uninstall

1. Quit Levo from the menubar: Quit Levo.
2. Move `/Applications/Levo.app` to the Trash.
3. Levo's own data lives in a Levo folder inside `~/Library/Application Support`, and its preferences are in `~/Library/Preferences/co.cntxtlabs.levo.plist` (bundle id `co.cntxtlabs.levo`). Remove them only if the user asks.
4. The licence key and instance id are in the user's Keychain. Remove them there only if the user asks.
5. If the user added Levo's read-only tools to their agent, remove the `levo-mcp` entry from that agent's MCP config.

## Contact

info@cntxtlabs.co, or https://cntxtlabs.co/levo
