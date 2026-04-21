## 1. Crypto helpers in src/token.ts

- [ ] 1.1 Add `deriveSymmetricKey(editKeySeedHex: string): Uint8Array` — returns first 32 bytes of `nacl.hash` over the raw seed
- [ ] 1.2 Add `encryptLog(ndjson: string, editKeySeedHex: string): Uint8Array` — generates random 24-byte nonce, encrypts with `nacl.secretbox`, returns `LVDN\x01 + nonce + ciphertext`
- [ ] 1.3 Add `decryptLog(artifact: Uint8Array, editKeySeedHex: string): string` — validates magic prefix, extracts nonce + ciphertext, decrypts with `nacl.secretbox.open`, throws on failure
- [ ] 1.4 Add unit tests for `deriveSymmetricKey`, `encryptLog`, and `decryptLog` (roundtrip + wrong-key error)

## 2. Log accumulation in src/watcher.ts

- [ ] 2.1 Add optional `logEntries: LogEntry[]` accumulator parameter (or internal array activated by a `logging: boolean` flag) to `startWatcher`
- [ ] 2.2 On outgoing `push`: compute SHA-256 of content, append `{ ts, dir: "out", editor, contentHash, signature, size }` to log
- [ ] 2.3 On incoming verified `update`: compute SHA-256 of content, append `{ ts, dir: "in", editor, contentHash, signature, size }` to log
- [ ] 2.4 Expose `flushLog(): LogEntry[]` helper (or return entries) so CLI can retrieve them on exit

## 3. CLI wiring in src/cli.ts

- [ ] 3.1 Add `--log [path]` option to `share` command (optional value: default path derived from watched filename)
- [ ] 3.2 On `--log`: print `Logging session to <path>` confirmation after sharer-ack
- [ ] 3.3 Register SIGINT and SIGTERM handlers that call the log-flush-and-write path before exiting
- [ ] 3.4 On clean exit (`q` keypress): call log-flush-and-write path, print artifact path
- [ ] 3.5 Implement log-flush-and-write: serialize entries to NDJSON, call `encryptLog`, write binary to resolved output path

## 4. decrypt-log subcommand in src/cli.ts

- [ ] 4.1 Add `decrypt-log` command with `<file>` argument and optional `--key <hex>` flag
- [ ] 4.2 Read artifact file bytes; validate `LVDN\x01` magic prefix, exit 1 with error message on mismatch
- [ ] 4.3 If `--key` not provided: prompt for edit key on stderr with echo disabled (use `readline` with `process.stderr`)
- [ ] 4.4 Call `decryptLog` with artifact bytes and key; catch decryption errors and exit 1 with user-friendly message
- [ ] 4.5 Write decrypted NDJSON to stdout; exit 0

## 5. Tests

- [ ] 5.1 Unit test: `startWatcher` with logging enabled accumulates entries for `push` events
- [ ] 5.2 Unit test: `startWatcher` with logging enabled accumulates entries for verified `update` events
- [ ] 5.3 Unit test: `startWatcher` with logging enabled does NOT accumulate entries for `update` events that fail signature verification
- [ ] 5.4 Integration test: `livedown share --log` writes an encrypted artifact on SIGINT
- [ ] 5.5 Integration test: `livedown decrypt-log` roundtrips a known artifact back to NDJSON

## 6. Documentation

- [ ] 6.1 Update `README.md` to document `--log` flag and `decrypt-log` subcommand in "How It Works" / usage section
- [ ] 6.2 Update `docs/architecture.md` "Key Files" table to note session logging in `src/token.ts` and `src/watcher.ts`
