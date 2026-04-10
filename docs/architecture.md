# Livedown Architecture

Livedown lets you share a local file and collaborate on it live — across browsers, terminals, and machines. You edit locally, everyone else sees it instantly.

## Overview

```
  ┌─────────┐              ┌─────────┐              ┌─────────┐
  │  Local   │    signed    │  Relay  │   updates    │ Remote  │
  │  File    │────pushes───▶│ (Cloud) │─────────────▶│ Viewers │
  │          │◀──verified───│         │◀──signed─────│         │
  └─────────┘   WebSocket   └─────────┘  WebSocket   └─────────┘
     CLI                    PartyKit /                Browser or
     watcher               Cloudflare                  another
                             Workers                     CLI
```

Three components. All communication is via WebSocket. The relay is stateful per room (tracks who's sharing, verifies signatures, broadcasts updates). Everything else is stateless.

| Component | Code | Runtime | Crypto |
|-----------|------|---------|--------|
| **CLI + Watcher** | `src/cli.ts`, `src/watcher.ts` | Node.js | tweetnacl |
| **Relay** | `src/party/livedown.ts` | Cloudflare Workers (PartyKit) | @noble/curves |
| **Browser Viewer** | `public/index.html` | Browser | tweetnacl (CDN) |

## Journeys

### Journey 1: Share (CLI → Web)

The sharer runs `livedown share ./file.md`. A viewer opens the URL in a browser.

```
  Terminal                           Cloud                         Browser
  ────────                           ─────                         ───────

  $ livedown share ./file.md
  │
  │ generate Ed25519 keypair
  │ print "Watching ./file.md"
  │ print "Connecting..."
  │
  │ startWatcher()
  │         │
  │         │──── WebSocket ────────▶ Relay
  │         │                         │ onConnect
  │         │◀──── init ──────────────│
  │         │                         │
  │         │──── set-token ─────────▶│
  │         │     { publicKey }       │ sharers.add(conn)
  │         │◀──── sharer-ack ───────│
  │         │                         │
  │         │──── push ──────────────▶│
  │         │     { content,          │ verify sig ✓
  │         │       signature }       │ store content
  │         │                         │
  │◀── ready                          │
  │                                   │
  │ print "Join  https://.../#abc"    │
  │ print "Edit key  f7a2c9e1..."     │
  │ print "o open  c copy  q quit"    │
  │                                   │
  │                                   │         User opens URL
  │                                   │◀──────── WebSocket ────────── │
  │                                   │ onConnect                     │
  │                                   │──────── init ────────────────▶│
  │                                   │  hasSharer: true              │
  │                                   │  content: "..."               │
  │                                   │  publicKey: X                 │
  │                                   │                            ✓ Live
  │                                   │                            Content
  │                                   │                            renders
```

**Key property:** the Join URL is never printed before the relay confirms the sharer is registered (`sharer-ack`). The viewer can never arrive at an empty room via a freshly printed URL.

### Journey 2: Edit Live (CLI → Web ← Edit Online)

A viewer with the edit key makes changes in the browser. The sharer's local file is updated.

```
  Terminal               Cloud                    Browser
  ────────               ─────                    ───────

  (watching ./file.md)    (room live)              (viewing, read-only)
  │                       │                        │
  │                       │                        │ User clicks
  │                       │                        │ "Enter Edit Key"
  │                       │                        │
  │                       │                        │ Pastes edit key
  │                       │                        │ (64 hex chars)
  │                       │                        │
  │                       │                        │ Browser derives
  │                       │                        │ keypair from seed,
  │                       │                        │ verifies public key
  │                       │                        │ matches room's
  │                       │                        │
  │                       │                        │ ✓ Editor unlocked
  │                       │                        │
  │                       │                        │ User types in
  │                       │                        │ CodeMirror editor
  │                       │                        │ (400ms debounce)
  │                       │                        │
  │                       │◀──── push ─────────────│
  │                       │  { content: "new text", │
  │                       │    signature: "abc..." } │
  │                       │                        │
  │                       │ verify sig ✓           │
  │                       │ store content          │
  │                       │                        │
  │                       │──── update ───────────▶│ (other viewers)
  │◀──── update ──────────│  { content, sig }      │
  │  { content,           │                        │
  │    signature }        │                        │
  │                       │                        │
  │ verify sig ✓          │                        │
  │ write to ./file.md    │                        │
  │                       │                        │
  │  dave  new text...    │                        │
  │                       │                        │

  Wrong key? ──────────────────────────────────────│
  │                       │◀──── push (bad sig) ───│
  │                       │ verify sig ✗           │
  │                       │──── auth-error ───────▶│ Modal shows error
  │  ✗ Guest 3 — rejected │──── auth-rejected ────▶│ (other viewers)
```

**Three verification points:** the relay verifies before broadcasting, the watcher verifies before writing to disk, and the browser verifies the public key on entry. Even a compromised relay cannot forge updates that the watcher accepts.

### Journey 3: Share to Remote Machine (Future — In Progress)

Two people share a file across machines. One is the leader, the other joins and gets a local copy.

```
  Machine A                Cloud                    Machine B
  ─────────                ─────                    ─────────

  $ livedown share ./notes.md
  │                         │
  │ (same as Journey 1)     │
  │ ...                     │
  │ print Join URL          │
  │ print Edit key          │
  │                         │
  │ Share URL + edit key    │                        │
  │ with Machine B          │                        │
  │ (via Slack, email...)   │                        │
  │                         │                        │
  │                         │            $ livedown join <url>
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
  │                         │                        │ write content to
  │                         │                        │ ./local-notes.md
  │                         │                        │
  │                         │                        │ watch local file
  │                         │                        │
  │ User A edits            │                        │
  │ ./notes.md              │                        │
  │                         │                        │
  │──── push ──────────────▶│                        │
  │                         │ verify ✓               │
  │                         │──── update ───────────▶│
  │                         │                        │ verify ✓
  │                         │                        │ write to local file
  │                         │                        │
  │                         │               User B edits
  │                         │               ./local-notes.md
  │                         │                        │
  │                         │◀──── push ─────────────│
  │                         │ verify ✓               │
  │◀──── update ────────────│                        │
  │ verify ✓                │                        │
  │ write to ./notes.md     │                        │
  │                         │                        │
  │ Both machines in sync   │    Both machines in sync
```

**Status:** not yet implemented. Requires a `livedown join` command that downloads content, creates a local file, and starts a watcher in the reverse direction. The `sharers: Set` in the relay already supports multiple sharers — no relay changes needed.

## Browser State Machine

```
            ┌────────────┐
            │  Loading   │   spinner visible, ws connecting
            └─────┬──────┘
                  │ init arrives
                  │
           ┌──────┴──────┐
           │             │
       hasSharer      hasSharer
         true           false
           │             │
           ▼             ▼
    ┌──────────┐   ┌───────────┐
    │   Live   │   │ NotFound  │
    └────┬─────┘   └─────┬─────┘
         │               │
         │sharer-gone    │sharer-here
         │               │
         ▼               ▼
    ┌──────────┐   ┌──────────┐
    │ Offline  │──▶│   Live   │
    └──────────┘   └──────────┘
         ▲              │
         │sharer-here   │sharer-gone
         └──────────────┘
```

| State     | UI | Edits? |
|-----------|----|--------|
| Loading   | Spinner, "Connecting..." | No |
| Live      | Editor + preview, status bar shows "live" | If edit key entered |
| Offline   | Same UI, status bar shows "sharer offline", editor read-only | No |
| NotFound  | Landing page, "no one is sharing this document" | No |

**Rule:** NotFound is only reachable from Loading. Once Live, the viewer can only go to Offline (recoverable), never back to the landing page.

## Message Types

### Client → Relay

| Type | Fields | Sent by |
|------|--------|---------|
| `set-token` | `publicKey` | Sharer (on connect) |
| `push` | `content`, `signature`, `meta` | Sharer or unlocked viewer |

### Relay → Sender only

| Type | Purpose |
|------|---------|
| `sharer-ack` | set-token accepted; CLI prints URL |
| `auth-error` | push rejected (bad signature) |

### Relay → All (broadcast)

| Type | Fields | Purpose |
|------|--------|---------|
| `init` | `content`, `meta`, `guestId`, `hasSharer`, `protected`, `publicKey` | Sent to each connection on connect |
| `update` | `content`, `meta`, `signature` | After a valid push |
| `sharer-here` | `protected`, `publicKey` | Sharer joined an empty room |
| `sharer-gone` | — | Last sharer disconnected |
| `auth-rejected` | `editor` | Someone's push was rejected (info for sharer) |

## Security

See [Security Principles](../.claude/agents/security.md) for the full set of rules.

- **Ed25519 signing** — pushes are signed with the edit key (private), verified with the public key
- **Defense in depth** — relay verifies before broadcasting; watcher verifies before writing to disk
- **URLs are locators, not credentials** — the viewer URL is safe to share publicly
- **No custom crypto** — tweetnacl (Node/browser) and @noble/curves (relay) only

## What Must Stay in Sync

Any PR that changes the protocol, message types, or state transitions must update:

- This document (`docs/architecture.md`)
- `README.md` "How It Works" section
- `CLAUDE.md` architecture references
