## 1. Token utility

- [ ] 1.1 Add `generateViewKey(): string` to `src/token.ts` (32 random bytes → 64 hex chars)
- [ ] 1.2 Export `generateViewKey` and verify it is 64 hex chars in existing token tests

## 2. Relay — private room support

- [ ] 2.1 Add `viewKey: string | undefined` and `isPrivate: boolean` fields to `LivedownRoom`
- [ ] 2.2 Update `set-token` handler: if `msg.viewKey` is present, store it as `this.viewKey` and set `this.isPrivate = true`; auto-set `viewAuthenticated = true` on the sharer connection
- [ ] 2.3 Update `onConnect`: in private rooms send `init` with `private: true`, `content: null`, `publicKey: null` to unauthenticated connections; send full `init` to view-authenticated connections (sharers on reconnect)
- [ ] 2.4 Add `view-auth` message handler: compare `msg.viewKey` to `this.viewKey`; on match set `viewAuthenticated = true`, send `view-auth-ack`, then send full `init` with content; on mismatch send `view-auth-error`
- [ ] 2.5 Update `update` broadcast: filter recipients to view-authenticated connections only in private rooms
- [ ] 2.6 Update `sharer-here` broadcast: include `private: true` field when room is private

## 3. Watcher — pass view key to relay

- [ ] 3.1 Add optional `viewKey?: string` parameter to `startWatcher()` signature
- [ ] 3.2 Include `viewKey` in the `set-token` message when it is present

## 4. CLI — --private flag and view key output

- [ ] 4.1 Add `--private` boolean option to the `share` command in `src/cli.ts`
- [ ] 4.2 Add `--view-key <key>` option to the `share` command (reuse existing key like `--edit-key`)
- [ ] 4.3 Generate or resolve `viewKey` in `startSharing()` when `opts.private` is true
- [ ] 4.4 Pass `viewKey` through to `startWatcher()` when in private mode
- [ ] 4.5 Print `View key  <64-hex>  (press v to copy)` line before `Edit key` line after `sharer-ack`
- [ ] 4.6 Add `v` keyboard shortcut in TTY mode: copy `viewKey` to clipboard, show confirmation
- [ ] 4.7 Update hints line to `o open  v copy view key  c copy key  q quit` when in private mode

## 5. Browser — view-key modal and auth flow

- [ ] 5.1 Add view-key modal HTML and CSS (parallel structure to the existing `#token-modal`; use id `#view-modal`)
- [ ] 5.2 Add `isPrivate`, `viewKey`, and `viewAuthenticated` JS variables alongside existing `isProtected`/`editUnlocked`
- [ ] 5.3 In the `init` handler: if `msg.private === true` and not yet view-authenticated, store `isPrivate = true` and open the view-key modal instead of transitioning to `live`
- [ ] 5.4 On view-key modal submit: send `view-auth { viewKey }` over the WebSocket; disable the submit button while awaiting response
- [ ] 5.5 Handle `view-auth-ack`: set `viewAuthenticated = true`, store `viewKey` in memory; wait for the follow-up `init` from the relay (which will contain full content) to transition to `live`
- [ ] 5.6 Handle `view-auth-error`: show inline error in the modal, re-enable the submit button
- [ ] 5.7 On WebSocket reconnect (`ws.onopen`): if `isPrivate && viewKey`, automatically send `view-auth { viewKey }` before the `init` arrives
- [ ] 5.8 Update `updateProfileAccess()`: in private rooms, show `(View Only)` when `viewAuthenticated && !editUnlocked`; keep `(Editor)` when `editUnlocked`
- [ ] 5.9 Update `applySharerInfo()`: set `isPrivate` from `msg.private`

## 6. Documentation

- [ ] 6.1 Update `docs/architecture.md` message-type tables: add `view-auth` to Client→Relay, add `view-auth-ack` and `view-auth-error` to Relay→sender-only, update `init` and `sharer-here` entries with `private` field
- [ ] 6.2 Update the browser state machine diagram in `docs/architecture.md` to show the view-auth gate for private rooms
- [ ] 6.3 Add view-key description to the security section of `docs/architecture.md`
- [ ] 6.4 Update `README.md` "How It Works" section to mention private mode
- [ ] 6.5 Update `README.md` "Security" section to describe the view key alongside the edit key

## 7. Tests

- [ ] 7.1 Add unit tests for `generateViewKey()` in the token test file (length, hex format, uniqueness)
- [ ] 7.2 Add relay unit tests for private room: unauthenticated `init` omits content; correct `view-auth` triggers `view-auth-ack` + full `init`; wrong `view-auth` triggers `view-auth-error`; `update` only goes to authenticated connections
- [ ] 7.3 Verify `npm test`, `npm run lint`, and `npm run build` all pass
