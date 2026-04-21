## Why

Livedown sessions produce a stream of signed edits — who changed what, and when — but that history vanishes when the session ends because the relay is ephemeral and holds no persistent state. Users who want an audit trail, replay capability, or post-session review have no way to recover it. Capturing session logs locally (on the sharer's machine) and storing them encrypted with the edit key closes this gap without compromising the security model.

## What Changes

- The CLI gains an optional `--log` flag on `livedown share` that activates session logging.
- When logging is enabled, the watcher appends a newline-delimited JSON (NDJSON) entry for every verified `push` and `update` event — including timestamp, editor name, content hash, and signature.
- After the session ends (sharer exits), the accumulated log is encrypted with a symmetric key derived from the edit key (using NaCl secretbox / XSalsa20-Poly1305) and written to an `.livedown-session` artifact file alongside the watched document.
- A new `livedown decrypt-log <file>` command (or `--decrypt` flag) reads an artifact file, prompts for the edit key, derives the symmetric key, decrypts, and writes the plaintext NDJSON to stdout.
- No changes to the relay, the WebSocket protocol, or the browser viewer — logging is purely local to the sharer's CLI.

## Capabilities

### New Capabilities

- `session-logging`: Opt-in capture of per-edit log entries (timestamp, editor, content hash, signature) during a live session, written to an encrypted artifact file on session end.
- `session-log-decrypt`: CLI sub-command / flag to decrypt a session log artifact using the edit key, outputting plaintext NDJSON to stdout.

### Modified Capabilities

<!-- No existing spec-level requirements change. -->

## Impact

- **`src/cli.ts`**: Add `--log` option to `share` command; add `decrypt-log` subcommand.
- **`src/watcher.ts`**: Accept a logging callback; record entries on `push` sent and `update` received (after signature verification).
- **`src/token.ts`**: Add a `deriveSymmetricKey` helper (HKDF or NaCl's `hash` over the edit key seed) and `encryptLog` / `decryptLog` functions using `nacl.secretbox`.
- **Dependencies**: No new runtime dependencies — `tweetnacl` already provides `secretbox`. Node's built-in `crypto` provides any needed key-derivation.
- **File output**: One `.livedown-session` file per session, written on clean exit (and optionally on SIGTERM).
