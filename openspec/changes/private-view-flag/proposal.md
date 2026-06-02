## Why

Anyone with the Join URL can currently read a shared document in full — only editing is key-gated. This exposes sensitive content whenever a URL leaks (Slack previews, browser history, screen shares). A `--private` flag lets sharers require a view key before any content is delivered.

## What Changes

- New `--private` flag on `livedown share` opts the session into view-gated mode.
- A second key — the **view key** — is generated (or supplied via `--view-key`) alongside the existing edit key. The view key is a 64-hex-char random token (32 bytes). The edit key is a superset: holding it grants view access too, so editors need only one secret.
- The relay gates `init` content and all `update` broadcasts behind per-connection view authentication. Unauthenticated connections receive `init` with `private: true` and no content or public key.
- Viewers enter the view key (or the edit key) via a new browser modal; the browser sends a `view-auth { key }` message; the relay grants access if the key matches the view key or derives the room's edit public key, then replies with `view-auth-ack` and full content.
- The browser automatically re-sends `view-auth` on WebSocket reconnect (view key kept in memory).
- The CLI prints both keys and adds a `v` shortcut to copy the view key.
- Without `--private`, behaviour is identical to today — no view key, content delivered to all.

## Capabilities

### New Capabilities

- `private-sharing`: View-gated document sharing — CLI flag, key generation, relay enforcement, browser auth modal, auto-reconnect re-auth, and CLI output for the view key.

### Modified Capabilities

<!-- No existing capability specs require requirement-level changes. -->

## Impact

- **`src/token.ts`** — new `generateViewKey()` export.
- **`src/cli.ts`** — new `--private` / `--view-key` options; updated output and keyboard shortcuts.
- **`src/watcher.ts`** — `viewKey?` parameter; sent in `set-token`.
- **`src/party/livedown.ts`** — per-connection `viewAuthenticated` flag; new `view-auth` message handler accepting the view key or the edit key (public-key derivation); gated `init` and `update` routing.
- **`public/index.html`** — new view-key modal accepting either key; `view-auth` / `view-auth-ack` / `view-auth-error` handling; edit-key detection to auto-unlock editing; auto-re-auth; profile badge update.
- **`docs/architecture.md`** — updated message-type tables, state-machine diagram, and security section.
- **`README.md`** — updated "How It Works" and "Security" sections.
- No new npm dependencies.
