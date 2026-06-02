# CLAUDE.md

## Project

Livedown shares local markdown files live via WebSocket. Security is critical — the tool writes remote content to local disk.

## Architecture

**Primary source of truth: [`docs/architecture.md`](docs/architecture.md).** It documents the overview diagram, journey flows, browser state machine, message types, and security model.

## Design

**Viewer chrome and landing page follow [`docs/design.md`](docs/design.md).** Any change to the header layout, mode toggle, roster/lock affordances, or landing page must update `docs/design.md` in the same PR. Code that drifts from the design doc is a bug.

**Round-trip visual changes back to Claude Design.** The committed bundle under `./design/` (and the canvas it was exported from on claude.ai/design) is the source of truth for visual intent. Any change to:

- CLI terminal output (banners, status lines, prompts, color scheme, keybind hints, anything `livedown share` prints)
- Browser viewer styles (header, panes, modals, popovers, color tokens, typography)
- Landing page styles (`public/index.html` landing block or `site/index.html`)

must also be reflected in the Claude Design canvas before the PR is considered done. Update the prototypes there, re-export the bundle, and drop a new `design/design-bundle-N.zip` (incrementing N) — older snapshots stay available (per `docs/design.md` "Source of truth"). The doc, the canvas, and the shipped code stay in lockstep — divergence here is what invented the design-vs-implementation drift problem these rules exist to stop.

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

**MANDATORY before opening or updating a PR:** run `npm run lint && npm run build && npm test` (or `make test` for the full suite including integration). All three must pass. Never push or open a PR while any of them are red — CI will fail and the diff lands in a broken state. If a test is unrelated to the change but already failing on the branch, fix or quarantine it first.

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

## GitHub workflows and actions

Rules for any change under `.github/workflows/` or `.github/actions/`. These are mandatory, not advisory.

1. **Duplicative content is a bug.** Any bash, env block, or `gh` sequence that would appear in two or more workflows or jobs MUST be extracted into a composite action under `.github/actions/<verb>/action.yml` and called via `uses:`. Extract **before** the second copy is written. If you catch yourself about to paste a block across jobs, stop and extract first. Inline duplication is never acceptable.

2. **Prefer composite actions over shell scripts under `.github/workflows/scripts/`.** Composite actions are the GitHub-native unit of reuse; they declare typed inputs and don't depend on the repo being checked out at the script's path.

3. **Name env vars the way the consumer reads them.** If a downstream action reads `process.env.FOO`, export it as `FOO` — not `AGENT_FOO`, not `INPUT_FOO`. Verify by reading the action's source; do not infer from input names in `action.yml`.

## OpenSpec Flow

OpenSpec Flow runs from the external [`dwmkerr/openspec-flow`](https://github.com/dwmkerr/openspec-flow) reusable workflow. Upstream owns the plan/implement/respond/cleanup pipeline, the composite actions, and the agent prompt. Spec authoring and change-folder conventions still live in `openspec/` here. Refer to the upstream repo for workflow internals, label semantics, and required secrets.

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
- `ANTHROPIC_API_KEY` — used by Claude-driven workflows (agent-actions, security-review, plus the external openspec-flow shim). Exactly one of `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` should be set — **the Claude Agent SDK uses the API key when both are present** (same precedence as the local `claude` CLI). To route OAuth / subscription auth, delete the API key secret first.
- `CLAUDE_CODE_OAUTH_TOKEN` — alternative to `ANTHROPIC_API_KEY`: runs Claude Code against your Pro/Max subscription instead of API billing. Generate with `claude setup-token` locally. Before using in CI, read Anthropic's [authentication docs](https://code.claude.com/docs/en/authentication) and the [consumer terms](https://www.anthropic.com/legal/consumer-terms) — OAuth-backed CI is sanctioned for personal use on your own repo, but Anthropic has banned accounts that fired on third-party PR events (see [claude-code-action#838](https://github.com/anthropics/claude-code-action/issues/838)). Rotation: `gh secret delete` does not revoke the token server-side; also revoke at https://claude.ai/settings/claude-code.
- `AGENT_GITHUB_TOKEN` — PAT used by agent workflows that need repo write scope beyond the default `GITHUB_TOKEN`.

`PARTYKIT_LOGIN` is the partykit username (currently `dwmkerr`). It is **not** a secret — it's hardcoded at the workflow `env:` level in `deploy.yaml`. Change it there if the relay account changes.

## Key Files

- `src/token.ts` — Ed25519 keypair generation, signing, verification (tweetnacl)
- `src/party/livedown.ts` — relay server, signature verification (@noble/curves)
- `src/watcher.ts` — file watcher, signs pushes, verifies incoming updates
- `src/cli.ts` — CLI entry point, generates edit key
- `public/index.html` — browser viewer (tweetnacl via CDN)
