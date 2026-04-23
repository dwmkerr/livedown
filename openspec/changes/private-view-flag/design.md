## Context

Livedown uses Ed25519 asymmetric signing to protect writes. The sharer generates a keypair; the private key seed (edit key) is shared with trusted editors. The public key is broadcast to all viewers. The relay verifies every push signature before broadcasting.

Content delivery is currently unconditional: `onConnect` sends the full `init` message (including content) to every WebSocket connection. There is no viewer authentication path.

The relay runs on PartyKit / Cloudflare Workers and uses `@noble/curves` for Ed25519. The browser uses `tweetnacl` (CDN). Node CLI uses `tweetnacl` too. No additional crypto libraries exist.

## Goals / Non-Goals

**Goals:**
- Gate content delivery behind a view key in private mode.
- Keep the default (public) mode behaviour unchanged.
- Use a separate view key so view access and edit access can be distributed independently.
- Authenticate viewers per-connection at the relay, not via URL parameters.
- Auto-re-authenticate on WebSocket reconnect without user interaction.
- Withhold both content and the edit public key from unauthenticated connections.

**Non-Goals:**
- Encrypting content end-to-end (the relay sees plaintext — consistent with the current trust model).
- Persistent room state or view-key revocation.
- Rate-limiting failed view-auth attempts (out of scope for v1).
- Embedding the view key in the URL (explicitly excluded — URL leak is the threat we're preventing).

## Decisions

### Decision 1: Two separate keys (view key ≠ edit key)

**Chosen:** Generate a new random `viewKey` (32 bytes → 64 hex chars) independent of the `editKey`.

**Why over single key:** A single key would mean anyone granted view access can also sign pushes (they hold the private seed). Many use cases need view-only distribution (e.g., share a draft with reviewers, keep edit control with one person). Two keys preserves role separation.

**Alternative considered:** Derive the view key from the edit key (e.g., HMAC of edit key with a constant). Rejected — if the view key is compromised, an attacker could brute-force the edit key derivation. Fully independent keys avoid this.

### Decision 2: Direct token comparison at the relay (no challenge-response)

**Chosen:** Sharer sends `viewKey` (raw hex) in `set-token`; viewers send the same `viewKey` in `view-auth`; relay compares directly using `===`.

**Why over challenge-response (nonce signing):** The relay already holds content in plaintext and is trusted infrastructure. The WebSocket connection is wss:// (TLS), so the `view-auth` message is encrypted in transit. A challenge-response round trip would add protocol complexity (new message type, timing edge cases) without meaningfully improving security given the existing trust model.

**Why over hash comparison (store sha256(viewKey)):** Would require a new hash library (`@noble/hashes` or Web Crypto) across all three runtimes (relay, browser, CLI). The raw key stored in the relay's in-memory room state presents the same exposure as the content itself — no incremental risk.

### Decision 3: Relay sends a second `init` after successful `view-auth`

**Chosen:** After view authentication, the relay sends a second `init` message (with full content) to the newly authenticated connection.

**Why over a new `content-deliver` message:** Re-using `init` means the browser's existing `init` handler does all the work — content render, meta, profile setup — without a new code path. The `guestId` in the second `init` may be repeated (same connection); this is harmless because `setProfile` is idempotent.

**Alternative considered:** A dedicated `view-auth-content` message with just content and meta. Rejected — adds a new message type and a parallel render path in the browser.

### Decision 4: Per-connection `viewAuthenticated` flag on the relay (not a Set like `sharers`)

**Chosen:** Store `viewAuthenticated` as a boolean property on each `Party.Connection` via `(conn as any).viewAuthenticated`.

**Why:** PartyKit does not expose a typed property bag per connection; the same pattern is already used for `guestId` (see `livedown.ts` line 41). Using a `Set<string>` of connection IDs would work but requires cleanup in `onClose`. A per-connection property avoids that lifecycle concern.

### Decision 5: Sharer connections are auto-authenticated

**Chosen:** When `set-token` is accepted and the sender is added to `sharers`, also set `(conn as any).viewAuthenticated = true`.

**Why:** The sharer knows the view key (they generated it). Auto-authenticating avoids an extra round trip and means the sharer's own browser (if opened via `o`) works immediately.

### Decision 6: Browser keeps view key in memory; re-sends on reconnect

**Chosen:** Store `viewKey` in a JS variable (same scope as `editKey`). On WebSocket `onopen` (when `isPrivate && viewKey`), immediately send `view-auth` before the `init` reply arrives.

**Why:** Users should not be asked to re-enter the view key every time the WebSocket drops and reconnects. Since the view key is just a string variable it survives reconnects (not page reloads, which is acceptable).

### Decision 7: Withhold `publicKey` from unauthenticated `init`

**Chosen:** In private mode, unauthenticated `init` sets `publicKey: null`.

**Why:** The edit public key is the target for offline brute-force of the edit key. Withholding it removes that attack surface for unauthenticated connections. After view-auth succeeds, the full `init` (with public key) is sent and the browser can derive edit capability.

## Risks / Trade-offs

**[Risk] Relay stores raw view key in memory** → Mitigation: This matches the existing threat model (relay holds content in plaintext). PartyKit rooms are ephemeral — the key disappears when the last connection drops. No additional exposure beyond current state.

**[Risk] View key sent over WebSocket (even under TLS)** → Mitigation: TLS provides transport-layer confidentiality. The risk is equivalent to any password sent over HTTPS. Acceptable for a CLI tool targeting developers.

**[Risk] Browser re-sends view key on every reconnect** → Mitigation: The key is in memory, not localStorage or a cookie. It is not persisted across page loads. A page reload requires re-entry, which is expected behaviour.

**[Risk] Second `init` resets profile/meta** → Mitigation: `setProfile` and `setMeta` are idempotent. Re-running them with the same values has no visible effect.

**[Risk] Existing `view-auth` message name collision** → Mitigation: No existing message uses this name (confirmed by reading all message types in `livedown.ts` and `index.html`). New messages: `view-auth` (client→relay), `view-auth-ack` (relay→sender), `view-auth-error` (relay→sender).

## Migration Plan

- No relay-side storage, no database migrations.
- The `--private` flag is opt-in; existing sessions without it behave identically.
- Deploy relay first (it now handles the new `view-auth` message and `set-token.viewKey` field gracefully — unknown message types are already silently ignored). Then deploy CLI/browser.
- Rollback: revert relay and CLI/browser deployments independently. Rooms in-flight during rollback will show the old behaviour (public) after the relay reverts.

## Open Questions

None blocking implementation.
