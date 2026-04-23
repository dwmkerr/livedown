## ADDED Requirements

### Requirement: Private flag opts a shared document into view-key protection
The `livedown share` command SHALL accept a `--private` flag that, when set, generates a **view key** (a second Ed25519 keypair, distinct from the edit key) and requires viewers to prove knowledge of that key before the relay will disclose document content. Without the flag, sharing behaviour SHALL be unchanged.

#### Scenario: Default sharing is unchanged
- **WHEN** a user runs `livedown share ./file.md` without `--private`
- **THEN** the relay SHALL send document content to all connecting viewers as it does today, and no view key SHALL be generated

#### Scenario: Private sharing generates a view key
- **WHEN** a user runs `livedown share ./file.md --private`
- **THEN** the CLI SHALL generate a second Ed25519 keypair, print the view key on its own line alongside the edit key, and register the view public key with the relay

### Requirement: CLI prints and offers to copy the view key
When `--private` is active, the CLI SHALL display the view key in the share info block and provide a keyboard shortcut to copy it, matching the ergonomics of the existing edit-key display.

#### Scenario: View key appears in the info block
- **WHEN** the CLI starts sharing a private document
- **THEN** the info block SHALL include a line of the form `View key  <64 hex chars>` immediately above or below the existing `Edit key` line

#### Scenario: Hotkey copies the view key
- **WHEN** the user presses `v` in the running CLI for a private session
- **THEN** the view key SHALL be copied to the system clipboard and a confirmation message SHALL be printed

### Requirement: Relay withholds content from unauthed viewers in private rooms
In a private room, the relay SHALL omit `content` and `meta` from the `init` message sent to any connection that has not yet proven knowledge of the view key, and SHALL NOT broadcast `update` messages to such connections.

#### Scenario: Initial connection sees no content
- **WHEN** a viewer connects to a private room without supplying any credential
- **THEN** the `init` message received SHALL have `viewProtected: true` and SHALL NOT contain `content` or `meta`

#### Scenario: Unauthed viewer is excluded from live updates
- **WHEN** the sharer pushes an update to a private room and a connected viewer has not yet completed authentication
- **THEN** the relay SHALL NOT send the `update` message to that viewer

### Requirement: Relay authenticates viewers via a challenge-response signed with the view key
The relay SHALL support an `auth-request` / `auth-challenge` / `auth-response` exchange in which the viewer signs a relay-issued nonce with the view private key and the relay verifies the signature against the stored view public key.

#### Scenario: Valid signature unlocks content
- **WHEN** a viewer sends `auth-response` with a valid Ed25519 signature over the nonce from the relay's preceding `auth-challenge`
- **THEN** the relay SHALL mark the connection as authed and send an `init-content` message containing the current `content` and `meta`, after which the connection SHALL receive all subsequent `update` broadcasts

#### Scenario: Invalid signature is rejected
- **WHEN** a viewer sends `auth-response` with a signature that does not verify against the view public key
- **THEN** the relay SHALL send an `auth-error` message, leave the connection unauthed, and continue withholding content

#### Scenario: Nonce is single-use
- **WHEN** a connection reuses a nonce from a prior challenge, or uses a nonce not issued to it
- **THEN** the relay SHALL reject the `auth-response` regardless of signature validity

### Requirement: Browser viewer presents a Locked state for private rooms
The browser viewer SHALL render a **Locked** state whenever the initial `init` message reports `viewProtected: true` and the viewer has not yet authed. The Locked state SHALL NOT display the document title, content, preview, or metadata.

#### Scenario: Locked state is entered from Loading
- **WHEN** the browser receives `init` with `hasSharer: true` and `viewProtected: true`
- **THEN** the viewer SHALL transition from Loading to Locked and show a prompt of the form "This document is private. Enter view key."

#### Scenario: Correct view key transitions to Live
- **WHEN** the user enters a view key whose derived public key matches `viewPublicKey` and the challenge-response succeeds
- **THEN** the viewer SHALL transition to Live and render the document content returned in `init-content`

#### Scenario: Wrong view key is reported inline
- **WHEN** the user enters a view key that does not match or whose signature is rejected
- **THEN** the modal SHALL display an error, remain open, and keep the viewer in the Locked state

### Requirement: Rename of relay init flag to distinguish edit vs view protection
The relay's `init` and `sharer-here` messages SHALL expose separate `editProtected` and `viewProtected` boolean fields, replacing the existing `protected` field.

#### Scenario: Edit-only protection (default sharing)
- **WHEN** a sharer starts without `--private`
- **THEN** the relay SHALL set `editProtected: true` and `viewProtected: false` in `init` and `sharer-here`

#### Scenario: View-and-edit protection (private sharing)
- **WHEN** a sharer starts with `--private`
- **THEN** the relay SHALL set both `editProtected: true` and `viewProtected: true` in `init` and `sharer-here`, and include `viewPublicKey`

### Requirement: View private seed never transits the network
The view private seed SHALL remain on the viewer's machine at all times. Only signatures over relay-issued nonces SHALL be sent over the WebSocket; no part of the seed or derived private key material SHALL appear in any message to the relay.

#### Scenario: Only signatures cross the wire
- **WHEN** any message is sent from a viewer to the relay during authentication
- **THEN** the message SHALL contain at most a signature and public metadata — never the seed, never the private key bytes
