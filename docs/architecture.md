# Livedown Architecture

Livedown lets you share a local file and collaborate on it live - across browsers, terminals, IDEs, and machines. You edit locally, everyone else sees it instantly. Share a key and others can share and sync to their machines in real-time. Perfect for live collaboration on specs or designs, multi-person multi-agent live editing, connecting to GitHub to rapidly iterate on issue descriptions, pull requests and more.

This page covers the essentials of how livedown works, and then some specific journeys:

- [Sharing a local file to web](#journey-1-share-cli-to-web)
- [Edit live, from local file to browser](#journey-2-edit-live-cli-to-web-edit-online)
- [Sharing to a remote machine](#journey-3-share-to-remote-machine-future) - one file synchronised across machines with live collab

## Overview

```
                              ┌───────────────┐
                              │    Website    │
                              │  (Viewer UI)  │
                              └───────┬───────┘
                                      │ WebSocket
                                      │
  ┌──────────────┐          ┌─────────┴─────────┐          ┌──────────────┐
  │  CLI - Share │  signed  │   Stateful Room   │  signed  │  CLI - Join  │
  │              │──pushes─▶│                   │◀─pushes──│   (future)   │
  │ (Local File) │◀verified─│       Relay       │─verified▶│ (Local File) │
  └──────┬───────┘          └───────────────────┘          └──────┬───────┘
         │                       (PartyKit)                       │
         │                                                        │
  Vim, Cursor, ...                                         Vim, Cursor, ...
```

The relay is a stateful WebSocket room hosted on Cloudflare Workers via [PartyKit](https://partykit.io). It holds a single room per shared document, tracks which connections are sharers, verifies Ed25519 signatures on every push, and broadcasts verified updates to all connected clients. It also serves the browser viewer as a static HTML page.

The relay does not persist data. Rooms exist only while connections are active. When the last client disconnects, the room state is lost.

| Component | Code | Runtime | Crypto |
|-----------|------|---------|--------|
| **CLI + Watcher** | `src/cli.ts`, `src/watcher.ts` | Node.js | tweetnacl |
| **Relay** | `src/party/livedown.ts` | Cloudflare Workers (PartyKit) | @noble/curves |
| **Browser Viewer** | `public/index.html` | Browser | tweetnacl (CDN) |


## Journeys

### Journey 1: Share (CLI to Web)

The sharer runs `livedown share ./file.md`. A viewer opens the URL in a browser.

```
  Terminal                           Relay                         Browser
  ────────                           ─────                         ───────

  $ livedown share ./file.md
  │
  1. Generate Ed25519 keypair
  │
  2. Connect to relay
  │         │──── WebSocket ────────▶│
  │         │◀──── init ─────────────│
  │         │                        │
  3. Register as sharer
  │         │──── set-token ────────▶│
  │         │     { publicKey }      │ sharers.add(conn)
  │         │◀──── sharer-ack ──────│
  │         │                        │
  4. Push initial content
  │         │──── push ─────────────▶│
  │         │     { content, sig }   │ verify sig, store content
  │         │                        │
  5. Show join info
  │                                  │
  │  Watching  ./file.md             │
  │  Join      https://.../#abc      │
  │  Edit key  f7a2c9e1...           │
  │  o open  c copy key  q quit     │
  │                                  │
  │                                  │         6. Viewer opens URL
  │                                  │◀──────── WebSocket ──────────│
  │                                  │──────── init ───────────────▶│
  │                                  │  hasSharer: true             │
  │                                  │  content: "..."              │
  │                                  │  publicKey: X                │
  │                                  │                           7. Live
  │                                  │                           Content renders
  │                                  │                           Editor is read-only
```

1. **Generate keypair** - the CLI creates an Ed25519 keypair. The private key seed (64 hex chars) is the "edit key" shared with trusted editors. The public key goes to the relay.
2. **Connect** - the watcher opens a WebSocket to the relay. The relay assigns a guest ID and sends an `init` message.
3. **Register** - the watcher sends `set-token` with the public key. The relay adds the connection to its `sharers` set and replies with `sharer-ack`.
4. **Push** - the watcher reads the local file, signs the content, and pushes it. The relay verifies the signature and stores the content.
5. **Show join info** - the CLI only prints the join URL and edit key *after* receiving `sharer-ack`. The URL is never visible before the room is established.
6. **Viewer connects** - the browser opens a WebSocket. The relay sends `init` with `hasSharer: true` and the current content.
7. **Live** - the browser renders the content. The editor is read-only until the viewer enters an edit key.

### Journey 2: Edit live (CLI to Web, edit online)

A viewer with the edit key makes changes in the browser. The sharer's local file updates.

```
  Terminal               Relay                    Browser
  ────────               ─────                    ───────

  (watching ./file.md)    (room live)              (viewing, read-only)
  │                       │                        │
  │                       │                        1. Enter edit key
  │                       │                        │  (64 hex chars)
  │                       │                        │
  │                       │                        2. Browser derives keypair,
  │                       │                        │  verifies public key
  │                       │                        │  matches room
  │                       │                        │
  │                       │                        │  Editor unlocked
  │                       │                        │
  │                       │                        3. User types in editor
  │                       │                        │  (400ms debounce)
  │                       │                        │
  │                       │◀──── push ─────────────│
  │                       │  { content, signature } │
  │                       │                        │
  │                       4. Relay verifies sig
  │                       │                        │
  │◀──── update ──────────│──── update ───────────▶│ (other viewers)
  │  { content, sig }     │                        │
  │                       │                        │
  5. Watcher verifies sig │                        │
  │  write to ./file.md   │                        │
  │                       │                        │
  │  dave  new text...    │                        │
  │                       │                        │

  Wrong key? ──────────────────────────────────────│
  │                       │◀──── push (bad sig) ───│
  │                       │ verify sig fails       │
  │                       │──── auth-error ───────▶│ Modal shows error
  │  x Guest 3 - rejected │──── auth-rejected ────▶│ (other viewers)
```

1. **Enter edit key** - the viewer clicks "Enter Edit Key" in the status bar and pastes the 64-character hex key.
2. **Verify locally** - the browser derives the Ed25519 keypair from the seed and checks that the derived public key matches the room's public key. Wrong keys are rejected immediately without hitting the relay.
3. **Type** - the viewer types in the CodeMirror editor. After a 400ms debounce, the browser signs the content and sends a `push` message.
4. **Relay verifies** - the relay checks the signature against the stored public key. Valid pushes are broadcast as `update` messages. Invalid pushes get `auth-error` back to the sender and `auth-rejected` broadcast to other connections (so the sharer's CLI can log them).
5. **Watcher verifies** - the watcher independently verifies the signature before writing to disk. Even a compromised relay cannot forge updates that pass this check.

### Journey 3: Share to remote machine (future)

Two people share a file across machines. One is the leader, the other joins and gets a local copy.

```
  Machine A                Relay                    Machine B
  ─────────                ─────                    ─────────

  $ livedown share ./notes.md
  │                         │
  1-5. (same as Journey 1)  │
  │                         │
  │  Join URL + edit key    │
  │  shared out-of-band    │
  │  (Slack, email, etc.)   │
  │                         │
  │                         │         6. $ livedown join <url>
  │                         │                --edit-key <key>
  │                         │                        │
  │                         │◀─── WebSocket ─────────│
  │                         │──── init ─────────────▶│
  │                         │  content: "..."        │
  │                         │                        │
  │                         │◀─── set-token ─────────│
  │                         │  sharers.add(B)        │
  │                         │──── sharer-ack ───────▶│
  │                         │                        │
  │                         │                     7. Write content to
  │                         │                        ./local-notes.md
  │                         │                        Watch local file
  │                         │                        │
  8. User A edits locally   │                        │
  │──── push ──────────────▶│                        │
  │                         │ verify, broadcast      │
  │                         │──── update ───────────▶│
  │                         │                        │ verify, write
  │                         │                        │
  │                         │               9. User B edits locally
  │                         │                        │
  │                         │◀──── push ─────────────│
  │◀──── update ────────────│ verify, broadcast      │
  │ verify, write           │                        │
  │                         │                        │
  │  Both machines in sync  │     Both machines in sync
```

6. **Join** - Machine B runs `livedown join` with the URL and edit key. It connects to the relay, receives the current content, and registers as a second sharer.
7. **Create local copy** - the joiner writes the received content to a local file and starts watching it for changes.
8. **Edits flow A to B** - when User A edits their local file, the watcher pushes signed content. The relay verifies and broadcasts. Machine B's watcher verifies and writes to its local file.
9. **Edits flow B to A** - the reverse. Both machines stay in sync via the relay.

**Status:** not yet implemented. Requires a `livedown join` command. The relay already supports multiple sharers via its `sharers: Set` - no relay changes needed.

## Browser state machine

```
            ┌────────────┐
            │  Loading   │   spinner, ws connecting
            └─────┬──────┘
                  │ init arrives
                  │
        private & not yet ──────────▶ ┌────────────┐   view-key modal;
        view-authenticated            │  Private   │   content withheld
                  │ no                 └─────┬──────┘
                  │                          │ view-auth-ack + full init
                  │              ◀───────────┘ (edit key also unlocks editing)
           ┌──────┴──────┐
           │             │
       hasSharer      hasSharer
         true           false
           │             │
           v             v
    ┌──────────┐   ┌───────────┐
    │   Live   │   │ NotFound  │
    └────┬─────┘   └─────┬─────┘
         │               │
         │sharer-gone    │sharer-here
         │               │
         v               v
    ┌──────────┐   ┌──────────┐
    │ Offline  │-->│   Live   │
    └──────────┘   └──────────┘
         ^              │
         │sharer-here   │sharer-gone
         └──────────────┘
```

| State | UI | Edits? |
|-------|-----|--------|
| Loading | Spinner, "Connecting..." | No |
| Private | View-key modal, content hidden | No |
| Live | Editor + preview, status bar shows "live" | If edit key entered |
| Offline | Same UI, status bar shows "sharer offline", editor read-only | No |
| NotFound | Landing page, "no one is sharing this document" | No |

**Rule:** NotFound is only reachable from Loading. Once Live, the viewer can only go to Offline (recoverable), never back to the landing page.

**Private gate:** In private mode the viewer cannot reach Live until it submits a valid key. The key is held in memory and re-sent automatically on reconnect (a page reload re-prompts). Entering the **edit key** at this gate both grants view access and unlocks editing — no separate edit-key modal needed.

## Message types

### Client to Relay

| Type | Fields | Sent by |
|------|--------|---------|
| `set-token` | `publicKey`, `viewKey?` | Sharer (on connect); `viewKey` present in private mode |
| `push` | `content`, `signature`, `meta` | Sharer or unlocked viewer |
| `view-auth` | `key` | Viewer in a private room; `key` is the view key **or** the edit key |

### Relay to sender only

| Type | Purpose |
|------|---------|
| `sharer-ack` | set-token accepted; CLI shows join URL |
| `auth-error` | push rejected (bad signature) |
| `view-auth-ack` | view-auth accepted; a full `init` (with content) follows |
| `view-auth-error` | view-auth rejected (key matched neither the view key nor the edit key) |

### Relay to all (broadcast)

| Type | Fields | Purpose |
|------|--------|---------|
| `init` | `content`, `meta`, `guestId`, `hasSharer`, `protected`, `publicKey`, `private` | Sent to each connection on connect. In private mode, unauthenticated connections get `content: null` and `publicKey: null`. |
| `update` | `content`, `meta`, `signature` | After a valid push. In private mode, sent only to view-authenticated connections. |
| `sharer-here` | `protected`, `publicKey`, `private` | Sharer joined an empty room |
| `sharer-gone` | - | Last sharer disconnected |
| `auth-rejected` | `editor` | Someone's push was rejected (info for sharer) |

In **private mode** (sharer ran `livedown share --private`), the relay withholds content and the edit public key from any connection until it authenticates with a `view-auth`. The view key is a 64-hex-char symmetric token, independent of the edit key, but the **edit key is a superset** — submitting it in `view-auth` also grants view access (the relay derives its public key and compares to the room's). The sharer's own connection is auto-authenticated on `set-token`.

## Security

See [Security Principles](../.claude/agents/security.md) for the full set of rules.

Livedown uses **Ed25519 asymmetric signing** to protect the sharer's local files from unauthorized edits. When the sharer runs `livedown share`, the CLI generates an Ed25519 keypair:

- **Edit key** (private key seed, 64 hex chars) — shared only with trusted editors.
- **Public key** — sent to the relay and broadcast to all viewers.

Every push message is signed with the private key. Three independent verification points enforce authorization:

| Layer | Has | Verifies | Rejects |
|-------|-----|----------|---------|
| **Relay** | Public key | Signature on every push | Unsigned or invalid pushes are never broadcast |
| **Watcher** | Private key (derives public key) | Signature on incoming updates | Forged updates are never written to disk |
| **Browser** | Public key (from relay) | Edit key matches public key on entry | Wrong key is rejected before any push |

A compromised relay still cannot forge updates that the local watcher would accept — the watcher re-verifies every signature before writing to disk.

### Private mode (view key)

By default the viewer URL grants read access — only editing is key-gated. `livedown share --private` adds a second credential, the **view key**, that gates reading too, so a leaked Join URL reveals nothing.

- **View key** — a 64-hex-char symmetric token, independent of the edit key. Distribute it for view-only access.
- **Edit key is a superset** — submitting the edit key at the view gate also grants view access (the relay derives its public key and matches it against the room's), so editors need only one secret.
- The relay withholds content and the public key until a connection authenticates; unauthenticated `update` broadcasts are suppressed.

Unlike write integrity (which has defense in depth — relay *and* watcher both verify), **view gating is enforced at a single point: the relay.** This does not widen the trust boundary — the relay already holds document content in plaintext, so confidentiality *from the relay* was never claimed. The view key stops one threat: a leaked URL handing content to a stranger. Achieving defense-in-depth for confidentiality would require end-to-end encryption (relay broadcasts ciphertext), which is out of scope. The view key travels only in point-to-point messages (`set-token`, `view-auth`), never in a broadcast payload.

Principles:

- **Ed25519 signing** — pushes signed with the edit key (private), verified with the public key.
- **Defense in depth** — relay verifies before broadcasting; watcher verifies before writing to disk.
- **URLs are locators, not credentials** — the viewer URL is safe to share publicly.
- **No custom crypto** — [tweetnacl](https://github.com/dchest/tweetnacl-js) (Node/browser) and [@noble/curves](https://github.com/paulmillr/noble-curves) (relay) only.

## PartyKit and Cloudflare Workers

The relay runs on [PartyKit](https://partykit.io), which deploys to [Cloudflare Workers](https://workers.cloudflare.com). The relay uses [@noble/curves](https://github.com/paulmillr/noble-curves) for Ed25519 signature verification — a pure ESM library with no Node.js dependencies that bundles cleanly in Cloudflare's esbuild pipeline.

The CLI and browser use [tweetnacl](https://github.com/dchest/tweetnacl-js) for Ed25519 operations. Both libraries implement RFC 8032 Ed25519 and produce compatible signatures.

Rooms are ephemeral — they exist only while connections are active and have no persistent storage. The public key is held in memory for the room's lifetime and must be re-registered on each sharing session.

## What must stay in sync

Any PR that changes the protocol, message types, or state transitions must update:

- This document (`docs/architecture.md`)
- `README.md` "How It Works" section
- `CLAUDE.md` architecture references
