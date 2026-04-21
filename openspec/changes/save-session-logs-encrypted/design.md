## Context

Livedown's relay is deliberately ephemeral — it holds no persisted state and rooms evaporate when the last client disconnects. All edit history is currently lost on session end. The watcher in `src/watcher.ts` is the single point that sees every verified event: outgoing `push` messages (local edits) and incoming `update` messages (remote edits already verified against the Ed25519 public key). This makes it the natural, minimal-footprint place to capture a session log.

The existing crypto stack (`tweetnacl` for CLI/browser, `@noble/curves` for relay) already includes `nacl.secretbox` (XSalsa20-Poly1305), which provides authenticated symmetric encryption suitable for at-rest log protection. No new dependencies are required.

## Goals / Non-Goals

**Goals:**
- Opt-in, zero-impact-when-disabled session logging activated by `--log` on `livedown share`.
- Log every verified edit event (timestamp, editor, content SHA-256 hash, Ed25519 signature) in newline-delimited JSON (NDJSON) format.
- Encrypt the completed log with a key derived from the edit key seed before writing to disk.
- Provide a `livedown decrypt-log <file>` subcommand to recover plaintext NDJSON using the edit key.
- Written on clean exit (`q`, Ctrl-C) and on `SIGTERM`.

**Non-Goals:**
- Replay / re-broadcasting of session logs.
- Log streaming or incremental writes before session end (avoids partial plaintext on disk).
- Changes to the relay, WebSocket protocol, or browser viewer.
- Rotation or compression of large log files.
- Multi-session log aggregation.

## Decisions

### 1. Log format: NDJSON in memory, encrypted blob on disk

**Decision:** Accumulate log entries as an in-memory array of JSON objects during the session. On session end, serialize to NDJSON, encrypt the entire buffer as one secretbox, then write `<nonce><ciphertext>` to disk.

**Rationale:** Incremental encrypted writes require nonce management per chunk and complicate decryption. A single secretbox over the complete log is simpler and safer. Memory overhead is negligible for typical session sizes (thousands of edits × ~200 bytes each ≈ a few MB at most).

**Alternative considered:** Append-only encrypted file with one secretbox per entry. Rejected because it requires storing and managing many nonces and complicates the decrypt path.

### 2. Symmetric key derivation: SHA-512 of edit key seed → first 32 bytes

**Decision:** Derive the 32-byte secretbox key by running the raw 32-byte edit key seed through `nacl.hash` (SHA-512) and taking the first 32 bytes.

**Rationale:** The edit key seed is already high-entropy (32 random bytes). Domain-separating it via hash avoids reusing the signing key directly as an encryption key. `nacl.hash` is already in `tweetnacl` — no new dependency. HKDF would be more principled but requires additional code; the simpler derivation is sufficient for this use case.

**Alternative considered:** Use the edit key seed directly as the secretbox key. Rejected to avoid key-reuse between signing and encryption contexts.

### 3. Log entry contents

Each entry records:
```json
{
  "ts": "2026-04-21T14:32:10.123Z",
  "dir": "out" | "in",
  "editor": "<name>",
  "contentHash": "<sha256-hex>",
  "signature": "<ed25519-sig-hex>",
  "size": 1234
}
```

`contentHash` (SHA-256 of the content string) rather than the full content is logged. This keeps log size bounded and avoids storing document content in the artifact — the local file itself is the authoritative record.

### 4. Output filename

`<watched-filename>.livedown-session` in the same directory as the watched file (e.g., `notes.md.livedown-session`). Predictable, co-located, and obviously linked to the source file.

### 5. Artifact format

Binary: `<24-byte nonce><ciphertext>` written as raw bytes. A magic prefix (`LVDN\x01`) precedes the nonce for format identification and version tolerance.

### 6. decrypt-log subcommand

`livedown decrypt-log <file>` reads the artifact, prompts for the edit key (stdin, no echo), derives the key, decrypts, and writes NDJSON to stdout. Allows piping to `jq` or other tools.

## Risks / Trade-offs

- **Memory accumulation for long sessions** → Mitigation: Log entries store hashes, not content. A 24-hour session with one edit per second at ~200 bytes per entry ≈ 700 KB in memory — acceptable.
- **Partial log on unclean exit (OOM kill, SIGKILL)** → Mitigation: Document that SIGKILL cannot be intercepted; SIGTERM and `q` are handled. Consider a future enhancement for periodic partial writes.
- **Edit key loss = log unrecoverable** → Mitigation: Document clearly. The log is only as valuable as the edit key is available. Encourage users to store the edit key alongside the artifact.
- **SHA-512 key derivation is non-standard** → Mitigation: The approach is documented and simple to audit. The security requirement is confidentiality of local at-rest data, not interoperability with external KDFs.

## Open Questions

- Should `--log` accept an explicit output path (e.g., `--log ./session.livedown-session`) or always derive from the watched filename? Proposed default: derive from filename; accept an optional path argument.
- Should `decrypt-log` accept the edit key as a `--key` flag for scripting, or always prompt? Proposed default: always prompt (safer), with `--key` as an explicit opt-in for automation.
