## ADDED Requirements

### Requirement: Session logging is opt-in via CLI flag
The system SHALL only capture session logs when the user explicitly passes `--log` to `livedown share`. Without `--log`, behaviour SHALL be identical to the current baseline — no log file is written and no in-memory log is accumulated.

#### Scenario: Share without --log flag
- **WHEN** the user runs `livedown share ./file.md` without `--log`
- **THEN** no `.livedown-session` artifact file is created during or after the session

#### Scenario: Share with --log flag
- **WHEN** the user runs `livedown share ./file.md --log`
- **THEN** the CLI prints a confirmation line indicating session logging is active, and a `.livedown-session` artifact is written when the session ends

### Requirement: Log entries are captured for every verified edit event
The system SHALL append one log entry to the in-memory log for each event that passes signature verification: outgoing `push` messages sent by the local watcher, and incoming `update` messages received and verified from the relay.

#### Scenario: Local edit is pushed
- **WHEN** the watcher detects a local file change and sends a `push` message to the relay
- **THEN** an entry with `"dir": "out"` is appended to the in-memory log, containing the UTC timestamp, editor name, SHA-256 hash of the content, the Ed25519 signature, and the byte size of the content

#### Scenario: Remote edit is received and verified
- **WHEN** the watcher receives an `update` message from the relay and its Ed25519 signature passes verification
- **THEN** an entry with `"dir": "in"` is appended to the in-memory log, containing the UTC timestamp, editor name from `meta.editor`, SHA-256 hash of the content, the Ed25519 signature, and the byte size of the content

#### Scenario: Remote edit fails signature verification
- **WHEN** the watcher receives an `update` message whose signature does NOT pass verification
- **THEN** no log entry is appended (the update is already rejected and not written to disk)

### Requirement: Log entries store content hash, not content
Each log entry SHALL store the SHA-256 hex digest of the content string rather than the content itself, keeping artifact size bounded and ensuring the session log cannot be used to reconstruct document content independently of the local file.

#### Scenario: Entry format is correct
- **WHEN** a log entry is recorded
- **THEN** the entry is a JSON object with fields: `ts` (ISO-8601 UTC string), `dir` ("in" or "out"), `editor` (string), `contentHash` (64-char lowercase hex SHA-256), `signature` (128-char lowercase hex Ed25519 signature), `size` (integer, byte length of content)

### Requirement: Session log is encrypted before writing to disk
The system SHALL encrypt the complete in-memory NDJSON log using `nacl.secretbox` (XSalsa20-Poly1305) with a 32-byte symmetric key derived from the edit key seed before writing any bytes to disk. No plaintext log data SHALL be written to disk at any point.

#### Scenario: Symmetric key derivation
- **WHEN** the symmetric key is derived from the edit key seed
- **THEN** the key is the first 32 bytes of `nacl.hash` (SHA-512) applied to the raw 32-byte seed

#### Scenario: Artifact file format
- **WHEN** the encrypted artifact is written
- **THEN** the file begins with the 5-byte magic prefix `LVDN\x01`, followed by a 24-byte random nonce, followed by the `nacl.secretbox` ciphertext of the NDJSON payload

### Requirement: Artifact is written to a predictable co-located path
The system SHALL write the artifact to `<watched-file>.livedown-session` in the same directory as the watched file. If `--log <path>` is provided with an explicit path, that path SHALL be used instead.

#### Scenario: Default output path
- **WHEN** `livedown share ./docs/notes.md --log` is run without an explicit log path
- **THEN** the artifact is written to `./docs/notes.md.livedown-session`

#### Scenario: Explicit output path
- **WHEN** `livedown share ./docs/notes.md --log ./audit/session.livedown-session` is run
- **THEN** the artifact is written to `./audit/session.livedown-session`

### Requirement: Artifact is written on session end
The system SHALL write the encrypted artifact when the sharer's session ends via `q` keypress, `Ctrl-C` (SIGINT), or SIGTERM. If no log entries were recorded (e.g., the session ended before any edits), the system SHALL still write an artifact containing an empty NDJSON log (zero entries) to confirm the session was logged.

#### Scenario: Clean exit via q
- **WHEN** the sharer presses `q` to exit
- **THEN** the encrypted artifact is written before the process exits and the CLI prints the artifact path

#### Scenario: Exit via SIGINT
- **WHEN** the sharer presses `Ctrl-C`
- **THEN** the encrypted artifact is written before the process exits and the CLI prints the artifact path

#### Scenario: Exit via SIGTERM
- **WHEN** the process receives SIGTERM
- **THEN** the encrypted artifact is written before the process exits

#### Scenario: Zero-entry session
- **WHEN** logging is enabled but no edit events occurred before session end
- **THEN** the artifact is still written containing an empty NDJSON log (no lines)
