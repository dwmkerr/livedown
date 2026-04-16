## ADDED Requirements

### Requirement: CLI accepts multiple file paths
The CLI `livedown start` command SHALL accept one or more file path arguments. When a single path is provided the behaviour SHALL be identical to the existing single-file behaviour. When multiple paths are provided each file SHALL be watched and shared within the same session room.

#### Scenario: Single file argument (backwards-compatible)
- **WHEN** the user runs `livedown start README.md`
- **THEN** the session starts with one file and the viewer renders with no tab bar

#### Scenario: Multiple file arguments
- **WHEN** the user runs `livedown start README.md CHANGELOG.md`
- **THEN** the session starts with two files and the viewer renders a tab bar with both filenames

#### Scenario: Zero file arguments
- **WHEN** the user runs `livedown start` with no file paths
- **THEN** the CLI SHALL print a usage error and exit with a non-zero code

### Requirement: Each file push is tagged with filename
The watcher SHALL include a `name` field (basename of the file path) in every outgoing push message so the relay and viewer can identify which file the content belongs to.

#### Scenario: Push message for a specific file
- **WHEN** a watched file changes on disk
- **THEN** the push message sent to the relay SHALL include `{ name: "<basename>", content: "<markdown>", signature: "<sig>" }`

### Requirement: Signature covers filename and content
The Ed25519 signature for each file push SHALL be computed over the concatenation `name + ":" + content` (UTF-8 encoded). The relay and viewer SHALL verify using the same concatenation.

#### Scenario: Signature verification with correct payload
- **WHEN** the relay or viewer receives a file-update message
- **THEN** it SHALL verify the signature against `name + ":" + content` and accept the message only if verification passes

#### Scenario: Signature verification with tampered name
- **WHEN** a message arrives with a valid signature but a different `name` than was signed
- **THEN** verification SHALL fail and the message SHALL be discarded

### Requirement: Relay stores files as a keyed map
The relay room state SHALL store received files as a map keyed by filename. Each entry SHALL hold the latest `content`, `signature`, and `updatedAt` timestamp for that file.

#### Scenario: Relay stores first file update
- **WHEN** a signed file-update message is received for a filename not yet in the map
- **THEN** the relay SHALL add an entry to the `files` map and broadcast the update to all connected viewers

#### Scenario: Relay updates existing file entry
- **WHEN** a signed file-update message is received for a filename already in the map
- **THEN** the relay SHALL replace the existing entry and broadcast the update

#### Scenario: Relay rejects invalid signature
- **WHEN** a file-update message arrives with a signature that fails verification
- **THEN** the relay SHALL discard the message and SHALL NOT update its state

### Requirement: New viewer connections receive all current files
When a viewer connects to a session room the relay SHALL send a `session-state` message containing the complete current `files` map so late joiners see all files without requiring a re-push.

#### Scenario: Late-joining viewer receives all files
- **WHEN** a viewer connects to a room that already has two files in state
- **THEN** the viewer SHALL receive a single `session-state` message with both files and render the tab bar immediately

### Requirement: Viewer renders tab bar for multi-file sessions
The viewer SHALL display a tab bar only when the session contains more than one file. Clicking a tab SHALL display that file's markdown content. Single-file sessions SHALL render with no tab bar.

#### Scenario: Single-file session — no tab bar
- **WHEN** the viewer receives a session with exactly one file
- **THEN** no tab bar is rendered and the markdown content is displayed directly

#### Scenario: Multi-file session — tab bar visible
- **WHEN** the viewer receives a session with two or more files
- **THEN** a tab bar is rendered with one tab per file, labelled by basename

#### Scenario: Tab switch
- **WHEN** the user clicks a tab in the tab bar
- **THEN** the viewer SHALL display the markdown content of that file

#### Scenario: Active tab follows most-recent update
- **WHEN** a file-update message is received for a file that is not the currently active tab
- **THEN** the active tab SHALL switch to the updated file automatically
