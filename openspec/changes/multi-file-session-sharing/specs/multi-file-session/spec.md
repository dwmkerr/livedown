## ADDED Requirements

### Requirement: Room holds per-file content map
The relay room SHALL maintain a `files` map keyed by the `doc/filename` string, where each entry stores `{ content, meta, signature }`. The map is updated on every valid `push` message and included in full in the `init` message sent to newly connected viewers.

#### Scenario: New viewer receives all files on connect
- **WHEN** a viewer connects to a session with two previously pushed files
- **THEN** the `init` message contains a `files` object with both entries and an `activeFile` key pointing to the most-recently-pushed file

#### Scenario: Push updates only the target file
- **WHEN** the watcher pushes an update for `notes/intro.md`
- **THEN** the relay broadcast contains `{ type: "update", file: "notes/intro.md", content, meta, signature }` and all other file entries in the room map are unchanged

### Requirement: Browser file-picker renders all session files
The viewer SHALL display a scrollable strip of pill buttons — one per file — in the status bar. The active file pill SHALL be visually distinguished. Clicking a pill SHALL switch the preview and source panes to that file's content.

#### Scenario: File-picker appears with multiple files
- **WHEN** the viewer receives an `init` message with two or more entries in `files`
- **THEN** the status bar shows one pill per file, labelled with the filename (basename only)

#### Scenario: Switching active file updates both panes
- **WHEN** the user clicks the pill for `design.md`
- **THEN** the source pane and preview pane both update to show the content of `design.md`

#### Scenario: Incoming update for non-active file does not disrupt view
- **WHEN** the relay broadcasts an update for `intro.md` while the user is viewing `design.md`
- **THEN** the `intro.md` entry in the local files map is updated silently and the panes continue showing `design.md` unchanged

### Requirement: Session uses one edit key for all files
The session SHALL use a single Ed25519 keypair. The `set-token` message is sent once per WebSocket connection. Every `push` message for any file in the session SHALL carry a signature made with that keypair and SHALL be verified by the relay before broadcast.

#### Scenario: Signature verified for each file push
- **WHEN** the watcher pushes content for `notes/chapter2.md` signed with the session edit key
- **THEN** the relay verifies the signature and broadcasts the update

#### Scenario: Invalid signature for any file is rejected
- **WHEN** a push message for `notes/chapter2.md` carries a signature that does not match the session public key
- **THEN** the relay sends `{ type: "auth-error" }` to the sender and broadcasts `{ type: "auth-rejected" }` to other connections
