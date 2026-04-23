## ADDED Requirements

### Requirement: CLI accepts --private flag
The `livedown share` command SHALL accept a `--private` boolean flag that activates view-gated mode for the sharing session.

#### Scenario: Private session starts with view key printed
- **WHEN** the user runs `livedown share ./file.md --private`
- **THEN** the CLI SHALL generate a random 64-hex-char view key and print it alongside the edit key after `sharer-ack` is received

#### Scenario: --view-key option reuses a supplied view key
- **WHEN** the user runs `livedown share ./file.md --private --view-key <64-hex-chars>`
- **THEN** the CLI SHALL use the supplied view key instead of generating a new one

#### Scenario: Private flag absent means public mode
- **WHEN** the user runs `livedown share ./file.md` without `--private`
- **THEN** no view key is generated and content is delivered to all viewers as today

### Requirement: CLI output includes view key and updated keyboard hints
In private mode the CLI output after `sharer-ack` SHALL include a "View key" line and an updated hints line.

#### Scenario: View key line is printed
- **WHEN** a private session is established
- **THEN** the CLI output SHALL contain a `View key  <64-hex>` line before the `Edit key` line

#### Scenario: v shortcut copies view key
- **WHEN** the user presses `v` during a private session
- **THEN** the view key SHALL be written to the system clipboard and a confirmation message SHALL be displayed

#### Scenario: Hints line updated in private mode
- **WHEN** a private session is active
- **THEN** the keyboard hints line SHALL read `o open  v copy view key  c copy key  q quit`

### Requirement: View key generation
`src/token.ts` SHALL export a `generateViewKey(): string` function that returns a 64-hex-char random token (32 cryptographically random bytes encoded as hex).

#### Scenario: Generated view key is 64 hex characters
- **WHEN** `generateViewKey()` is called
- **THEN** the returned string SHALL be exactly 64 lowercase hexadecimal characters

#### Scenario: Successive calls return distinct values
- **WHEN** `generateViewKey()` is called twice
- **THEN** the two returned strings SHALL be different with overwhelming probability

### Requirement: Watcher sends view key in set-token
In private mode the watcher SHALL include `viewKey` in the `set-token` message sent to the relay.

#### Scenario: set-token includes viewKey in private mode
- **WHEN** the watcher connects to the relay in private mode
- **THEN** the `set-token` message SHALL contain a `viewKey` field with the 64-hex-char view key

#### Scenario: set-token omits viewKey in public mode
- **WHEN** the watcher connects to the relay without `--private`
- **THEN** the `set-token` message SHALL NOT contain a `viewKey` field

### Requirement: Relay gates content delivery behind view authentication
In private mode the relay SHALL withhold document content and the edit public key from any connection that has not successfully submitted the view key.

#### Scenario: Unauthenticated viewer receives init with no content
- **WHEN** a viewer connects to a private room without having sent `view-auth`
- **THEN** the relay SHALL send `init` with `private: true`, `content: null`, and `publicKey: null`

#### Scenario: Unauthenticated viewer receives no update broadcasts
- **WHEN** a valid push arrives in a private room
- **THEN** the relay SHALL broadcast `update` only to view-authenticated connections

#### Scenario: Sharer connection is automatically view-authenticated
- **WHEN** a connection sends `set-token` with the matching public key and a `viewKey`
- **THEN** the relay SHALL mark that connection as view-authenticated without requiring a `view-auth` message

### Requirement: Relay handles view-auth message
The relay SHALL accept a `view-auth` message from unauthenticated connections in private rooms and authenticate them if the view key matches.

#### Scenario: Correct view key authenticates the connection
- **WHEN** a viewer in a private room sends `view-auth { viewKey: "<correct-hex>" }`
- **THEN** the relay SHALL mark the connection as view-authenticated, send `view-auth-ack` to the sender, and then send a full `init` message (with content and public key) to the sender

#### Scenario: Incorrect view key is rejected
- **WHEN** a viewer in a private room sends `view-auth { viewKey: "<wrong-hex>" }`
- **THEN** the relay SHALL send `view-auth-error` to the sender and the connection SHALL remain unauthenticated

#### Scenario: view-auth in a public room is ignored
- **WHEN** a viewer sends `view-auth` to a room that is not private
- **THEN** the relay SHALL ignore the message (no response, no state change)

### Requirement: Browser displays view-key modal for private rooms
The browser viewer SHALL detect `private: true` in the `init` message and display a "View key required" modal before rendering any content.

#### Scenario: Modal appears on init with private: true
- **WHEN** the browser receives `init` with `private: true` and `content: null`
- **THEN** the editor and preview SHALL remain hidden and a modal SHALL be displayed asking for the view key

#### Scenario: Correct view key dismisses modal and renders content
- **WHEN** the user enters the correct view key in the modal and submits
- **THEN** the browser SHALL send `view-auth`, receive `view-auth-ack` followed by a full `init`, render the content, and dismiss the modal transitioning to the `live` state

#### Scenario: Incorrect view key shows error in modal
- **WHEN** the user enters an incorrect view key and submits
- **THEN** the browser SHALL receive `view-auth-error` and the modal SHALL remain open with an error message

#### Scenario: Modal is separate from the edit-key modal
- **WHEN** both view authentication and edit authentication are required
- **THEN** the view-key modal SHALL be shown first (before content is visible) and the edit-key modal SHALL be available separately after view authentication

### Requirement: Browser auto-re-authenticates on reconnect
After the user has successfully entered the view key, the browser SHALL automatically re-send `view-auth` whenever the WebSocket reconnects, without prompting the user again.

#### Scenario: Reconnect triggers automatic view-auth
- **WHEN** the WebSocket closes and reconnects while `viewKey` is held in memory
- **THEN** the browser SHALL send `view-auth { viewKey }` immediately on `ws.onopen`
- **AND** the relay SHALL respond with `view-auth-ack` and a full `init`, restoring the live state without user interaction

#### Scenario: Page reload requires re-entry
- **WHEN** the user reloads the page
- **THEN** the view key is no longer in memory and the modal SHALL be shown again

### Requirement: Profile badge shows view role in private rooms
In private rooms the profile badge SHALL indicate whether the viewer has view-only access or edit access.

#### Scenario: Authenticated non-editor shows View Only
- **WHEN** the viewer is view-authenticated but has not entered the edit key
- **THEN** the profile badge SHALL display `(View Only)` in the access segment

#### Scenario: Authenticated editor shows Editor
- **WHEN** the viewer is both view-authenticated and has entered the correct edit key
- **THEN** the profile badge SHALL display `(Editor)` (existing behaviour, unchanged)

### Requirement: Architecture documentation updated
The `docs/architecture.md` file SHALL be updated to reflect the new protocol messages, state machine changes, and security model additions introduced by private sharing.

#### Scenario: Message type tables include new messages
- **WHEN** a reader consults docs/architecture.md
- **THEN** the Client→Relay table SHALL include `view-auth` and the Relay→sender table SHALL include `view-auth-ack` and `view-auth-error`

#### Scenario: State machine diagram reflects private gate
- **WHEN** a reader consults the browser state machine section
- **THEN** the diagram SHALL show the view-auth gate between Loading and Live for private rooms

#### Scenario: Security section documents view key
- **WHEN** a reader consults the security section
- **THEN** the view key and its role SHALL be described alongside the edit key
