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

## Key Files

- `src/token.ts` — Ed25519 keypair generation, signing, verification (tweetnacl)
- `src/party/livedown.ts` — relay server, signature verification (@noble/curves)
- `src/watcher.ts` — file watcher, signs pushes, verifies incoming updates
- `src/cli.ts` — CLI entry point, generates edit key
- `public/index.html` — browser viewer (tweetnacl via CDN)
