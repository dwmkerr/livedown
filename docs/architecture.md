# Livedown Architecture

This document describes the components, connection flow, and state machines that govern how livedown shares a local file with remote viewers. It is the source of truth for the "how it works" story and must be kept up to date when the protocol, roles, or state transitions change.

## Components

```
   ┌───────────────────┐        ┌───────────────────┐        ┌─────────────────┐
   │                   │        │                   │        │                 │
   │  CLI + Watcher    │        │   Relay (Party)   │        │  Browser Viewer │
   │                   │        │                   │        │                 │
   │  - Node.js        │        │  - Cloudflare     │        │  - Static HTML  │
   │  - File I/O       │───────▶│    Worker         │◀───────│  - CodeMirror   │
   │  - Signs pushes   │   WS   │  - Stateful room  │   WS   │  - tweetnacl    │
   │  - Verifies       │        │  - Verifies sigs  │        │    (CDN)        │
   │    incoming       │        │  - Tracks sharers │        │  - Verifies     │
   │  - tweetnacl      │        │  - @noble/curves  │        │    public key   │
   │                   │        │                   │        │    on unlock    │
   └───────────────────┘        └───────────────────┘        └─────────────────┘
```

Three components, all talking WebSocket. The relay is stateful per room; everything else is stateless.

## Roles

A connection to the relay has one of two roles:

| Role        | Becomes by...                              | Can push? |
|-------------|--------------------------------------------|-----------|
| **Sharer**  | Sending `set-token` with matching pubkey   | Yes       |
| **Viewer**  | Just connecting                            | Only with edit key |

The relay distinguishes roles via a `sharers: Set<string>` of connection IDs. When the last sharer disconnects, the relay broadcasts `sharer-gone` and the room becomes effectively empty (viewers can still view the last content, but no more pushes are possible until a new sharer arrives).

## Connection flow (happy path)

```
  CLI              Watcher            Relay                       Browser
   │                 │                  │                            │
   │ livedown share  │                  │                            │
   │────────────────▶│                  │                            │
   │ print "Watching ./file.md"         │                            │
   │ print "Connecting..."              │                            │
   │                 │                  │                            │
   │                 │── WebSocket ────▶│                            │
   │                 │                  │ onConnect                  │
   │                 │                  │   guestId++                │
   │                 │◀── init ─────────│                            │
   │                 │                  │                            │
   │                 │── set-token ────▶│                            │
   │                 │   { publicKey }  │ sharers.add(conn.id)       │
   │                 │                  │ publicKey = X              │
   │                 │◀── sharer-ack ───│                            │
   │                 │                  │                            │
   │                 │── push ─────────▶│                            │
   │                 │   { content,     │ verify signature OK        │
   │                 │     signature }  │ latestContent = content    │
   │                 │                  │                            │
   │◀─── ready ──────│                  │                            │
   │                 │                  │                            │
   │ print "Join     https://.../#abc"  │                            │
   │ print "Edit key ...(press c)..."   │                            │
   │ print hint line                    │                            │
   │                 │                  │                            │
   │                                    │                            │
   │                                    │◀── WebSocket ──────────────│
   │                                    │ onConnect                  │
   │                                    │   guestId++                │
   │                                    │── init ───────────────────▶│
   │                                    │   hasSharer: true          │
   │                                    │   content: "..."           │
   │                                    │   publicKey: X             │
   │                                    │                          ✓ Live
```

**Key property: the Join URL is never printed before the relay has acknowledged the sharer.** The user cannot see or share the URL until the room is fully established. This eliminates the race where a viewer arrives before the sharer.

## Browser state machine

```
               ┌────────────┐
               │  Loading   │   initial state, websocket opening
               └─────┬──────┘
                     │ init arrives
                     │
              ┌──────┴──────┐
              │             │
          hasSharer?    hasSharer?
             true          false
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

### State descriptions

| State     | What the user sees                                                    | Edits allowed? |
|-----------|-----------------------------------------------------------------------|----------------|
| Loading   | Spinner, "Connecting..."                                              | No             |
| Live      | Status bar, editor, preview, last known content                       | If unlocked    |
| Offline   | Status bar with "sharer offline" indicator, editor in read-only mode, last known content still visible | No             |
| NotFound  | Landing page with "not found — no one is sharing this document"       | No             |

### Transitions

| From      | Event           | To        | Why |
|-----------|-----------------|-----------|-----|
| Loading   | `init hasSharer:true` | Live      | Sharer was already registered |
| Loading   | `init hasSharer:false`| NotFound  | No sharer; ghost room |
| NotFound  | `sharer-here`   | Live      | User started CLI after opening browser |
| Live      | `sharer-gone`   | Offline   | Sharer disconnected (maybe temporarily) |
| Offline   | `sharer-here`   | Live      | Sharer reconnected (CLI restart, network blip) |

**No timeouts anywhere.** Every transition is triggered by an explicit relay message. The browser never guesses.

## Why the old approach was broken

The old code tried to infer presence from **content**:

```js
if (msg.content) gotContent = true;
// ... 8 seconds later ...
if (!gotContent) showNotFound();
```

This broke because:
1. **Empty documents look identical to no-sharer rooms.** A new blank file is a perfectly valid thing to share.
2. **Content is not a presence signal.** The relay can have a sharer without any content yet (initial push hasn't arrived).
3. **Timeouts guess.** An 8-second wait is both too long (bad UX for genuine not-found) and too short (bad UX for slow networks).

The structural fix replaces content inference with explicit relay state:
- Relay tracks sharers as a `Set<string>` of connection IDs
- `init` message carries an authoritative `hasSharer: boolean` flag
- `sharer-here` / `sharer-gone` broadcasts handle live transitions

## Message types

### Sharer → Relay

| Type | Fields | Purpose |
|------|--------|---------|
| `set-token` | `publicKey` | Register as a sharer. Relay adds connection to `sharers` and stores the public key (first one wins; subsequent messages must match). |
| `push` | `content`, `signature`, `meta` | Push new content. Signature must be valid against the stored public key. |

### Relay → Sharer only

| Type | Fields | Purpose |
|------|--------|---------|
| `sharer-ack` | — | Confirms the `set-token` was accepted. CLI waits for this before printing the Join URL. |
| `auth-error` | — | Your push was rejected (bad signature). |

### Relay → Viewer broadcasts

| Type | Fields | Purpose |
|------|--------|---------|
| `init` | `content`, `meta`, `guestId`, `hasSharer`, `protected`, `publicKey` | Sent once per connection, immediately on connect. |
| `update` | `content`, `meta`, `signature` | Broadcast after a valid push. |
| `sharer-here` | `protected`, `publicKey` | Broadcast when a sharer joins an empty room. Viewers in `NotFound` or `Offline` transition to `Live`. |
| `sharer-gone` | — | Broadcast when the last sharer disconnects. Viewers in `Live` transition to `Offline`. |
| `auth-rejected` | `editor` | Information for the sharer: someone else tried to push with a bad key. |

## Security model

See also [Security](../README.md#security) in the README.

- **Ed25519 keypairs**: the CLI generates a 32-byte seed (the "edit key"). The public key is sent to the relay via `set-token`. The private key stays with the sharer and any authorized editors.
- **Defense in depth**: the relay verifies signatures before broadcasting; the watcher verifies signatures before writing to disk. A compromised relay cannot forge updates.
- **URLs are locators, not credentials**: the viewer URL is safe to share publicly. Editing requires the edit key, which is entered out-of-band (pasted into the browser modal or shared through a trusted channel).
- **Never implement cryptographic code**: `tweetnacl` in Node and browser, `@noble/curves` in the relay (PartyKit bundler can't handle tweetnacl's optional `require('crypto')`). Both implement RFC 8032 Ed25519 and produce interchangeable signatures.

## Edge cases

### Viewer arrives before sharer
Impossible in the happy path — the CLI doesn't print the URL until `sharer-ack` arrives. If the user saves the URL from a previous session and visits it, they land in `NotFound`. If they then start the CLI, they get `sharer-here` and transition to `Live`.

### Sharer disconnects mid-session
Relay calls `onClose`, removes from `sharers`, broadcasts `sharer-gone`. Viewers enter `Offline`. The editor becomes read-only but the last known content stays visible. When the CLI reconnects (manual restart or automatic reconnect loop), the new `set-token` triggers `sharer-here` and viewers return to `Live`.

### CLI network blip (Wi-Fi dropped briefly)
Watcher's WebSocket closes, reconnects after 2s. Relay sees disconnect → `sharer-gone`. Reconnect → new `set-token` → `sharer-here`. Viewers briefly see `Offline` then return to `Live`. Content is not lost; any edits made during the blip are pushed as soon as the connection is re-established.

### Multiple sharers (future)
Already supported by the `sharers: Set<string>`. Two CLIs can run against the same room (same public key) and both are counted as sharers. `hasSharer` stays true as long as at least one is connected.

### Empty document
`latestContent === ""` is valid. `hasSharer` is independent of content. The viewer enters `Live` with an empty editor.

### Ghost rooms (old URL, no sharer)
`init.hasSharer: false` immediately. Viewer goes straight to `NotFound`. No timeout involved.

## What must be kept in sync with this document

- `src/party/livedown.ts` — roles, message types, state transitions
- `src/watcher.ts` — sharer connection lifecycle, `sharer-ack` handling
- `src/cli.ts` — when the URL is printed (must be after ready)
- `public/index.html` — browser state machine, message handling
- `README.md` "How It Works" section — user-facing summary

If you change any of these, update this document in the same PR.
