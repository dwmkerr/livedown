# Livedown Architecture

Livedown lets you share a local file and collaborate on it live - across browsers, terminals, IDEs, and machines. You edit locally, everyone else sees it instantly. Share a key and others can share and sync to their machines in real-time. Perfect for live collaboration on specs or designs, multi-person multi-agent live editing, connecting to GitHub to rapidly iterate on issue descriptions, pull requests and more.

## Overview

```
                              ┌───────────────┐
                              │    Website    │
                              │  (Viewer UI)  │
                              └───────┬───────┘
                                      │ WebSocket
                                      │
                            ┌─────────┴─────────┐
                            │   Stateful Room   │
   signed pushes            │   (Relay)         │            signed pushes
  ┌────────────────────────▶│                   │◀────────────────────────┐
  │            verified     │                   │     verified           │
  │◀────────────────────────│                   │────────────────────────▶│
  │                         └───────────────────┘                        │
  │                              (PartyKit)                              │
  │                                                                      │
  ┌──────────────┐                                          ┌──────────────┐
  │ CLI - Share  │                                          │ CLI - Join   │
  │              │                                          │   (future)   │
  │ (Local File) │                                          │ (Local File) │
  └──────┬───────┘                                          └──────┬───────┘
         │                                                         │
  Editor (e.g. Vim)                                         Editor (e.g. Vim)
  IDE (e.g. Cursor)                                         IDE (e.g. Cursor)
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
| Live | Editor + preview, status bar shows "live" | If edit key entered |
| Offline | Same UI, status bar shows "sharer offline", editor read-only | No |
| NotFound | Landing page, "no one is sharing this document" | No |

**Rule:** NotFound is only reachable from Loading. Once Live, the viewer can only go to Offline (recoverable), never back to the landing page.

## Message types

### Client to Relay

| Type | Fields | Sent by |
|------|--------|---------|
| `set-token` | `publicKey` | Sharer (on connect) |
| `push` | `content`, `signature`, `meta` | Sharer or unlocked viewer |

### Relay to sender only

| Type | Purpose |
|------|---------|
| `sharer-ack` | set-token accepted; CLI shows join URL |
| `auth-error` | push rejected (bad signature) |

### Relay to all (broadcast)

| Type | Fields | Purpose |
|------|--------|---------|
| `init` | `content`, `meta`, `guestId`, `hasSharer`, `protected`, `publicKey` | Sent to each connection on connect |
| `update` | `content`, `meta`, `signature` | After a valid push |
| `sharer-here` | `protected`, `publicKey` | Sharer joined an empty room |
| `sharer-gone` | - | Last sharer disconnected |
| `auth-rejected` | `editor` | Someone's push was rejected (info for sharer) |

## Security

See [Security Principles](../.claude/agents/security.md) for the full set of rules.

- **Ed25519 signing** - pushes are signed with the edit key (private), verified with the public key
- **Defense in depth** - relay verifies before broadcasting; watcher verifies before writing to disk
- **URLs are locators, not credentials** - the viewer URL is safe to share publicly
- **No custom crypto** - tweetnacl (Node/browser) and @noble/curves (relay) only

## What must stay in sync

Any PR that changes the protocol, message types, or state transitions must update:

- This document (`docs/architecture.md`)
- `README.md` "How It Works" section
- `CLAUDE.md` architecture references
