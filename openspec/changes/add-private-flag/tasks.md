## 1. CLI

- [ ] 1.1 Add `--private` boolean flag to `livedown share` in `src/cli.ts`
- [ ] 1.2 Generate a second Ed25519 keypair (view key) when `--private` is set, using the same helper path as the edit key in `src/token.ts`
- [ ] 1.3 Print the view key on its own line in the share info block, alongside the existing edit key
- [ ] 1.4 Add a `v` keyboard shortcut to copy the view key; update the hotkey hint line
- [ ] 1.5 Pass the view public key through to the watcher so it can be sent to the relay

## 2. Watcher

- [ ] 2.1 In `src/watcher.ts`, extend the `set-token` message to include `viewPublicKey` when the sharer is private
- [ ] 2.2 No change to signing (edit key continues to sign pushes); view key is verification-only on the relay side

## 3. Relay

- [ ] 3.1 In `src/party/livedown.ts`, store optional `viewPublicKey` and a per-connection `authed: Set<string>`
- [ ] 3.2 On `set-token`, accept and remember `viewPublicKey` on first call; reject mismatched values on subsequent sharers
- [ ] 3.3 Rename `protected` field to `editProtected` in `init` and `sharer-here`; add `viewProtected` and `viewPublicKey` fields
- [ ] 3.4 When `viewProtected` is true, omit `content` and `meta` from the initial `init` message for unauthed connections
- [ ] 3.5 Handle `auth-request`: generate a 32-byte random nonce with `crypto.getRandomValues`, remember it per connection, send `auth-challenge`
- [ ] 3.6 Handle `auth-response`: verify the signature against `viewPublicKey` using `@noble/curves`; on success, add conn to `authed` and send `init-content`; on failure send `auth-error`
- [ ] 3.7 Gate `update` broadcasts on `authed` membership (plus the sharer connection IDs, which are implicitly authed)
- [ ] 3.8 Unit-test the auth flow: valid sig unlocks content; wrong sig stays locked; unauthed conn never sees `update` messages

## 4. Browser viewer

- [ ] 4.1 In `public/index.html`, add a `Locked` state to the state machine, reachable from `Loading` when `viewProtected` is true
- [ ] 4.2 Render a locked view: "This document is private. Enter view key." No title, preview, or meta is shown until authed
- [ ] 4.3 Wire a view-key input modal mirroring the existing edit-key modal (wrong-key handling, paste support)
- [ ] 4.4 On view-key entry, derive the Ed25519 keypair locally and verify it matches `viewPublicKey` before hitting the relay
- [ ] 4.5 Implement the challenge-response: send `auth-request`, sign the returned nonce with the view private key, send `auth-response`
- [ ] 4.6 On `init-content`, transition to `Live` and render as usual; on `auth-error`, show an inline error in the modal
- [ ] 4.7 Cache the entered view key in memory for the WS session so reconnects re-auth transparently

## 5. Tests

- [ ] 5.1 Unit test the relay auth flow (valid nonce signature, invalid signature, tampered nonce)
- [ ] 5.2 Unit test that `update` broadcasts skip unauthed connections in private rooms
- [ ] 5.3 Playwright scenario: start `livedown share --private`, open URL, assert Locked state, enter wrong key (error), enter right key (Live)
- [ ] 5.4 Playwright scenario: confirm an unauthed viewer never receives content even while a sharer is actively pushing updates

## 6. Documentation

- [ ] 6.1 Update `docs/architecture.md` — new state, new message types, renamed `protected` field, new security flow
- [ ] 6.2 Update the README "How It Works" and add a short `--private` example to usage
- [ ] 6.3 Update `CLAUDE.md` key-files notes if any new files are added (none expected)
