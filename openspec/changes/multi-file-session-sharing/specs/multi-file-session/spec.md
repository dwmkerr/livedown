## ADDED Requirements

### Requirement: Multi-file session input
The `livedown share` command SHALL accept a directory path or a list of file paths in addition to a single file path. All targeted markdown files MUST be included in one session under a single URL.

#### Scenario: Share a directory
- **WHEN** the user runs `livedown share ./docs/`
- **THEN** all `.md` files in the directory are watched and shared under a single session URL

#### Scenario: Share multiple explicit files
- **WHEN** the user runs `livedown share file1.md file2.md file3.md`
- **THEN** all three files are watched and shared under a single session URL

### Requirement: Per-file push messages
Each push message from the watcher SHALL include a `file` field identifying which file the content belongs to. The session's edit keypair MUST sign all file pushes.

#### Scenario: File change triggers push
- **WHEN** one of the watched files changes on disk
- **THEN** the watcher pushes a signed message with the file's content and a `file` field set to the file's identifier within the session

### Requirement: Relay stores per-file state
The relay room SHALL hold a content and metadata entry for each file in the session, keyed by file identifier. New connections MUST receive the full file map in the `init` message.

#### Scenario: New viewer connects
- **WHEN** a browser viewer connects to an active multi-file session
- **THEN** the `init` message contains content and metadata for all files currently in the session

#### Scenario: File update broadcast
- **WHEN** the relay receives a valid signed push for a specific file
- **THEN** it updates that file's entry and broadcasts an `update` message containing the file identifier and new content to all connected viewers

### Requirement: Browser file navigation
The browser viewer SHALL display a list of available files in the session and allow the viewer to switch between them. The active file's content MUST be shown in the editor and preview panes.

#### Scenario: Viewer switches files
- **WHEN** the viewer selects a different file from the file list
- **THEN** the editor and preview panes display the selected file's content without reloading the page

#### Scenario: Real-time update for non-active file
- **WHEN** an update arrives for a file the viewer is not currently viewing
- **THEN** the file list indicates the file has been updated, and switching to it shows the latest content
