## Why

Today anyone with the join URL can view the shared document — only editing requires the edit key. URLs leak through Slack previews, browser history, screen shares. A `--private` flag lets the sharer require a key to view as well, giving defense in depth when the URL is sensitive.

Issue: [#16 — feat: add --private flag to require a key for viewing](https://github.com/dwmkerr/livedown/issues/16).

## What Changes

- Add `--private` flag to `livedown share`. Opt-in. Default behaviour unchanged.
- When `--private` is set, the CLI generates a **view key** in addition to the existing edit key. Same shape: Ed25519 keypair, private seed printed as 64 hex chars, public key registered with the relay.
- Relay withholds document content from any viewer that has not proven knowledge of the view key.
- Browser viewer adds a **Locked** state: prompts for view key before rendering any content.
- Proof-of-knowledge uses a challenge-response signed with the view private key (same primitive as edit signing). No secret ever crosses the wire.

## Capabilities

### New Capabilities

- `private-sharing` — per-document view-key gating on top of the existing edit-key model.

### Modified Capabilities

- None. Edit-key flow is untouched.

## Impact

- `src/cli.ts` — parse `--private`, generate second keypair, print view key alongside edit key, add copy hotkey for view key.
- `src/watcher.ts` — send view public key to relay on `set-token` when private.
- `src/party/livedown.ts` — store optional view public key, gate `init` content and `update` broadcasts on per-connection auth flag, issue nonces, verify viewer signatures.
- `public/index.html` — new Locked state UI, view-key entry flow, challenge-response signing in browser.
- `docs/architecture.md`, `README.md` — document the private flag, new state, and message types.
- No breaking changes. Existing public rooms keep working unchanged.
