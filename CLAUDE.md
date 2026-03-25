# CLAUDE.md

## Project

Livedown shares local markdown files live via WebSocket. Security is critical — the tool writes remote content to local disk.

## Architecture

See README.md "How It Works" for the architecture diagram, component descriptions, key libraries, and security model. **This documentation must be kept up to date** — any PR that changes the architecture, adds/removes dependencies, or modifies the security model must update the README accordingly.

Specifically, keep current:
- The architecture diagram and component descriptions
- The "Key Libraries" table (add/remove entries when dependencies change)
- The "Security" section (update when auth/signing logic changes)
- The "PartyKit and Cloudflare Workers" section (update when relay infrastructure changes)

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
