## Design

### Key generation

The CLI already generates one Ed25519 keypair (the edit key). With `--private`, it generates a second, independent Ed25519 keypair (the view key). Same primitive, same library (`tweetnacl`), same printing convention (64-char hex seed).

```
livedown share ./file.md --private

  Watching  ./file.md
  Join      https://livedown.dev/#<room>
  View key  a81b...              (required to read)
  Edit key  f7a2...              (required to write)
  o open  c copy edit key  v copy view key  q quit
```

### Relay state

The relay already tracks one public key (edit). It adds an optional second:

```
publicKey:      string | undefined   // edit public key  (existing)
viewPublicKey:  string | undefined   // view public key  (new, set only for --private)
authed:         Set<string>          // connection IDs that proved view-key knowledge
```

### Init field rename

Today the relay sends `protected: !!publicKey` in `init`. This conflates "edit is protected" with "view is protected". Rename:

| Old | New |
|-----|-----|
| `protected` | `editProtected` |
| —           | `viewProtected` |

Browsers on the old field can continue to read `protected` for one release via a shim if needed — but since the relay is deployed alongside the browser HTML that it serves, a clean rename is simplest.

### Authentication flow (challenge-response)

Viewer connects. If room is view-protected, relay sends init **without content**:

```
Relay → Viewer
{
  type: "init",
  hasSharer: true,
  editProtected: true,
  viewProtected: true,
  publicKey: "<edit pub>",
  viewPublicKey: "<view pub>",
  content: null,
  meta: null
}
```

Viewer prompts for view key. On entry, viewer asks for a challenge:

```
Viewer → Relay    { type: "auth-request" }
Relay  → Viewer   { type: "auth-challenge", nonce: "<random 32 bytes hex>" }
Viewer → Relay    { type: "auth-response", signature: "<sign(nonce, viewPriv)>" }
Relay verifies signature against viewPublicKey.
  OK    → mark conn as authed, send { type: "init-content", content, meta }
  Fail  → send { type: "auth-error", reason: "bad-view-key" }
```

The relay broadcasts `update` messages only to connections in `authed` (plus the sharer themselves). Unauthed viewers receive nothing until they re-run the challenge.

### Browser state machine

```
        Loading
           │
   ┌───────┼────────────────────┐
   │       │                    │
hasSharer=true,          hasSharer=true,         hasSharer=false
viewProtected=false      viewProtected=true
   │                            │                    │
   ▼                            ▼                    ▼
┌──────┐                  ┌─────────┐           ┌──────────┐
│ Live │                  │ Locked  │           │ NotFound │
└──────┘                  └────┬────┘           └──────────┘
                               │ auth-ok
                               ▼
                           ┌──────┐
                           │ Live │
                           └──────┘
```

Locked shows: "This document is private. Enter view key." Nothing else — no title, no preview, no meta. Wrong-key handling mirrors the edit-key modal.

### Why not one key?

One-key (view key == edit key) simplifies UX but conflates grants. The issue explicitly calls out *"private collaboration where only invited participants should see anything"*, which is distinct from granting edit rights. Separate keys cost negligible extra complexity (same primitive, second seed) and keep grants independent. Future revocation can rotate view without kicking editors and vice-versa.

### Why not content-side encryption?

Encrypting the document blob would make the relay zero-trust for content, which is appealing. It is also a much larger change: every push + update carries ciphertext, a new symmetric key has to be derived and shared, and the protocol grows. Relay-gated auth reuses the existing Ed25519 primitive, keeps the message shape close to today's, and preserves the threat model (*signed pushes, independently verified*). Content-side encryption can be layered on later without breaking the flag semantics.

### Security principles

- **URLs are locators** — the join URL still contains no secret. The view key is shared out of band, exactly like the edit key.
- **Defense in depth** — signatures continue to be verified at relay and watcher. View-key auth is an additional gate on content disclosure.
- **Secrets never transit broadcast channels** — the view private seed never leaves the viewer. Only a nonce signature crosses the wire.
- **No custom crypto** — reuses `tweetnacl` (CLI + browser) and `@noble/curves` (relay). Nonce is 32 random bytes from `crypto.getRandomValues`.

### Edge cases

- **Reconnect** — nonce + auth are scoped to the WebSocket. A disconnect requires re-auth. Browsers cache the entered view key in memory for the session so reconnect is transparent.
- **Sharer-only view** — a sharer is implicitly authed (they know the edit key, but the view key is separate). To keep things simple, `set-token` from a sharer also marks that connection as authed for view purposes. Rationale: a sharer that does not know the view key cannot have created the room.
- **Second sharer joining a private room** (future `livedown join`) — joiner must supply both `--edit-key` and `--view-key`. Out of scope for this change but noted for protocol compatibility.
