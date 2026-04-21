## ADDED Requirements

### Requirement: decrypt-log subcommand decrypts a session artifact to stdout
The system SHALL provide a `livedown decrypt-log <file>` subcommand that reads an encrypted `.livedown-session` artifact, prompts the user for the edit key, derives the symmetric key, decrypts the artifact, and writes the plaintext NDJSON to stdout.

#### Scenario: Successful decryption
- **WHEN** the user runs `livedown decrypt-log ./notes.md.livedown-session` and provides the correct edit key when prompted
- **THEN** the plaintext NDJSON is written to stdout, one JSON object per line, and the process exits with code 0

#### Scenario: Incorrect edit key
- **WHEN** the user runs `livedown decrypt-log <file>` and provides an edit key that does not match the one used to encrypt the artifact
- **THEN** the system writes an error message to stderr (`Error: decryption failed — wrong edit key?`) and exits with code 1; no partial output is written to stdout

#### Scenario: File not found
- **WHEN** the user runs `livedown decrypt-log <file>` with a path that does not exist
- **THEN** the system writes an error message to stderr and exits with code 1

#### Scenario: File is not a valid artifact
- **WHEN** the user runs `livedown decrypt-log <file>` and the file does not begin with the `LVDN\x01` magic prefix
- **THEN** the system writes an error message to stderr (`Error: not a valid livedown session artifact`) and exits with code 1

### Requirement: Edit key is prompted securely with no echo
The system SHALL prompt for the edit key on stderr (so it is not captured when stdout is piped) with terminal echo disabled, so the key is not visible as the user types.

#### Scenario: Key prompt goes to stderr
- **WHEN** the user runs `livedown decrypt-log <file> > output.ndjson`
- **THEN** the key prompt appears in the terminal (stderr) and the plaintext NDJSON is written to `output.ndjson` without the prompt

#### Scenario: No-echo input
- **WHEN** the key prompt is displayed
- **THEN** characters typed at the prompt are not echoed to the terminal

### Requirement: Edit key may optionally be supplied via --key flag
The system SHALL accept an optional `--key <hex>` flag on `decrypt-log` that supplies the edit key non-interactively, bypassing the prompt. This is intended for scripting and automation.

#### Scenario: Key supplied via flag
- **WHEN** the user runs `livedown decrypt-log <file> --key <editkey>`
- **THEN** the system uses the provided key without prompting and, if correct, writes plaintext NDJSON to stdout

#### Scenario: Flag takes precedence over prompt
- **WHEN** both `--key` and an interactive terminal are available
- **THEN** the system uses the key from `--key` without showing the prompt
