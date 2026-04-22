# CLAUDE.md

## Project

Livedown shares local markdown files live via WebSocket. Security is critical — the tool writes remote content to local disk.

## Architecture

**Primary source of truth: [`docs/architecture.md`](docs/architecture.md).** It documents the overview diagram, journey flows, browser state machine, message types, and security model.

**This documentation MUST be kept up to date.** Any PR that changes any of the following MUST update `docs/architecture.md` in the same PR:

- Protocol or message types (new messages, changed fields)
- Roles or connection lifecycle (how sharers/viewers register)
- Browser state machine (new states, changed transitions)
- Relay behavior (signature verification, broadcasting logic)
- CLI output or startup sequence (handshake, keyboard shortcuts)
- New journeys or major features

README.md "How It Works" is the user-facing summary. Keep it in sync with the architecture doc:

- The architecture diagram and component descriptions
- The "Key Libraries" table (add/remove entries when dependencies change)
- The "Security" section (update when auth/signing logic changes)
- The "PartyKit and Cloudflare Workers" section (update when relay infrastructure changes)

## Testing

### Unit tests
```bash
npm test       # jest
npm run lint   # eslint
npm run build  # tsc
```

### Browser end-to-end tests with Playwright

Use the `playwright-webkit` MCP tools to test the browser viewer against a real running CLI. The standard test scenario:

1. **Start the sharer** in one terminal:
   ```bash
   npm start -- share ./tests/documents/empty.md
   ```
   Note the Join URL and Edit key printed.

2. **Test the viewer** with Playwright:
   - **Join:** Navigate to the Join URL. Verify the main UI shows (no "not found" banner). The status bar should show "live".
   - **Initial view:** Confirm the editor is visible and the document content (empty or otherwise) renders.
   - **Edit without key:** Click the editor and try typing. The "Edit key required" modal should appear. The status bar should show "(Read Only — Enter Edit Key)".
   - **Enter wrong key:** Paste an invalid key. The modal should show "Incorrect edit key" and stay open.
   - **Enter correct key:** Paste the real edit key from the CLI. The modal should close, the editor should become writable, and the profile badge should switch to "(Editor)".
   - **Edit:** Type in the editor. After the debounce (~400ms) the CLI should log the incoming edit.

3. **Test sharer disconnect:** Press `q` in the CLI terminal to exit. The browser should transition to "sharer offline" state (status bar shows "sharer offline", content stays visible, editor becomes read-only). **It should NOT kick to the "not found" landing page.**

4. **Test sharer reconnect:** Restart the CLI (same command, same edit key). The browser should transition back to "live" automatically.

Always use `./tests/documents/empty.md` as the first test — it confirms empty documents work (they should, since content is not a presence signal).

## Security

Run the security agent (`.claude/agents/security.md`) before merging security-sensitive changes. It enforces four principles:

1. URLs are locators, not credentials
2. Defense in depth — every component validates independently
3. Secrets never transit broadcast channels
4. Never implement crypto — use verified libraries (tweetnacl, @noble/curves)

## Conventions

- Conventional commits required (`feat:`, `fix:`, `docs:`, `chore:`)
- UI changes require before/after screenshots in PRs
- CLI changes should include terminal screenshots for non-trivial changes
- Never add breadcrumb comments — only explain *why*, not *what*

## OpenSpec Flow

Rules that apply when implementing against `.github/workflows/openspec-flow.yaml` or any of the `.github/actions/openspec-flow-*/` composite actions. Extracted later into a dedicated doc/skill.

### Dedupe with composite actions, never inline twice

If a block of workflow logic (env setup, bash script, `gh` sequence) would be the same across two or more of the `plan`, `implement`, `respond`, or `cleanup` jobs, extract it into a composite action under `.github/actions/openspec-flow-<verb>/action.yml` and reference it via `uses: ./.github/actions/openspec-flow-<verb>` in each caller. Do **not** inline duplicate copies across jobs. Pattern already established by `openspec-flow-prune-comments`, `openspec-flow-raise-comment`, `openspec-flow-flip-label`, `openspec-flow-handle-failure`, `openspec-flow-run-agent`.

Rationale: env-var name drift (e.g. `AGENT_ADDITIONAL_PERMISSIONS` vs `ADDITIONAL_PERMISSIONS`) has silently broken flow behaviour multiple times. Single source of truth avoids this.

### Claude session log location in CI

The Claude Code GitHub Action writes its session to `/home/runner/work/_temp/claude-execution-output.json` — a single JSON blob, not line-delimited.

Do **not** assume the interactive path pattern used by `dwmkerr/claude-toolkit`'s `grepsession.sh` (`$HOME/.claude/projects/-<cwd-mangled>/*.jsonl`). That path exists only on a developer's local machine running an interactive Claude Code session; it will be empty in CI.

If you need to extract sub-agent or skill usage from a CI run, parse `/home/runner/work/_temp/claude-execution-output.json` directly with `jq`. Example filter for `tool_use` entries:

```
jq -r '
  .. | objects | select(.type? == "tool_use")
  | select(.name == "Skill" or .name == "Task")
  | {name: .name, input: .input}
'
```

### Archive must sync delta specs to main

When `openspec-archive-change` runs for a change that adds a new capability (a `specs/<capability>/spec.md` under the change folder), the main spec at `openspec/specs/<capability>/spec.md` MUST be created or updated in the same impl PR. Silent-skipping the sync has been observed; if the skill does not emit the main-spec update, do it explicitly before opening the impl PR.

### External-repo references must be grounded

If the spec references any external repo, skill, plugin, or action (`dwmkerr/...`, `anthropics/...`, etc.), clone it to `/tmp` during EXPLORE and read the actual entry points. Do not assume interfaces based on name. If the repo's exposed surface does not match the spec's assumption (e.g. "it's a CLI" vs "it's a Claude Code plugin"), that is an Open Question / blocker, not something to hand-wave past.

## Deployment

Two workflows, one responsibility each. **Internal vs external** is the split:

- `.github/workflows/cicd.yaml` — **internal to the repo**. Validates PRs + pushes to `main`, then runs `release-please` to cut a release (tag + GitHub Release + CHANGELOG + version bump). When a release is cut, dispatches `deploy.yaml` with the new tag as `ref`. Nothing leaves the repo from this workflow.
- `.github/workflows/deploy.yaml` — **external**. Publishes to npm (`deploy-npm` job) and deploys the relay to PartyKit (`deploy-partykit` job) in parallel. Both jobs preflight their auth (`npm whoami`, `npx partykit whoami`) and carry `timeout-minutes` caps so a misconfigured token surfaces as a fast auth failure rather than a hang.

### Manual deploy

```bash
gh workflow run deploy.yaml --ref main                 # deploy tip of main
gh workflow run deploy.yaml --ref v1.2.3 -f ref=v1.2.3 # deploy a specific release
```

Or: Actions tab → `deploy` → "Run workflow".

### Secrets

All set under repo Settings → Secrets and variables → Actions:

- `NPM_TOKEN` — npm "Automation" / granular token with `package: write` on the `@dwmkerr` scope. Generate at npmjs.com → Access Tokens. Used by `deploy-npm` job in `deploy.yaml`.
- `PARTYKIT_TOKEN` — generate with `npx partykit token generate` on a machine logged in as the relay owner (`dwmkerr`). Used by `deploy-partykit` job in `deploy.yaml`. Rotate by regenerating and pasting the new value into Actions secrets.
- `CODECOV_TOKEN` — upload coverage from `validate` job.
- `ANTHROPIC_API_KEY` — used by Claude-driven workflows (agent-actions, openspec-flow, security-review).
- `AGENT_GITHUB_TOKEN` — PAT used by agent workflows that need repo write scope beyond the default `GITHUB_TOKEN`.

`PARTYKIT_LOGIN` is the partykit username (currently `dwmkerr`). It is **not** a secret — it's hardcoded at the workflow `env:` level in `deploy.yaml`. Change it there if the relay account changes.

## Agent workflow permissions

The OpenSpec Flow agent step (in `.github/workflows/openspec-flow.yaml`) runs `anthropics/claude-code-action`, which exchanges the OIDC token for a GitHub App installation token. That token grants **only** `contents: write`, `pull_requests: write`, `issues: write` by default — **not** `workflows: write`. Any agent attempt to push `.github/workflows/*.yaml` changes will be silently dropped from the commit or rejected at push.

This is observable as impl PRs that archive + update main specs but contain zero workflow edits, even when the spec target is the flow workflow itself.

To grant the agent `workflows: write`, two things are required (both must be set):

**1. Repo / org variable `AGENT_ADDITIONAL_PERMISSIONS`**

- Non-secret, lives in Settings → Secrets and variables → Actions → **Variables** tab → New repository variable.
- Name: `AGENT_ADDITIONAL_PERMISSIONS`
- Value: `workflows: write`
- Unset / empty = action default (no extra scope).
- Forwarded to `claude-code-action` as the `additional_permissions` input via the workflow's top-level `env:` block.

```bash
gh variable set AGENT_ADDITIONAL_PERMISSIONS --body "workflows: write"  # enable
gh variable delete AGENT_ADDITIONAL_PERMISSIONS                        # disable
```

**2. Claude GitHub App permission on the repo**

- Settings → **GitHub Apps** → Claude → Configure (the repo-level link)
- Repository permissions → **Workflows** → Read and write
- Save.

Without step 2, step 1 has no effect — the OIDC exchange can only grant scopes the app is installed with.

**Default state for new projects**: leave `AGENT_ADDITIONAL_PERMISSIONS` unset. Only turn on when implement tasks legitimately need to edit `.github/workflows/*.yaml`. livedown has it on because its own flow workflow is a primary implementation target (meta: the flow can modify itself).

## Key Files

- `src/token.ts` — Ed25519 keypair generation, signing, verification (tweetnacl)
- `src/party/livedown.ts` — relay server, signature verification (@noble/curves)
- `src/watcher.ts` — file watcher, signs pushes, verifies incoming updates
- `src/cli.ts` — CLI entry point, generates edit key
- `public/index.html` — browser viewer (tweetnacl via CDN)
