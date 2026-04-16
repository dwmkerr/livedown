## ADDED Requirements

### Requirement: CLI accepts a directory path as the share target
When a directory path is passed to `livedown share`, the CLI SHALL expand it to all `*.md` files present at startup in that directory (non-recursive). If no markdown files are found, the CLI SHALL print an error and exit with code 1.

#### Scenario: Sharing a directory expands to markdown files
- **WHEN** the user runs `livedown share ./docs` and `./docs` contains `intro.md` and `guide.md`
- **THEN** both files are included in the session and the CLI prints `Watching 2 files`

#### Scenario: Empty directory exits with error
- **WHEN** the user runs `livedown share ./empty-dir` and the directory contains no `*.md` files
- **THEN** the CLI prints `Error: no markdown files found in <path>` and exits with code 1

#### Scenario: Non-existent path exits with error
- **WHEN** the user passes a path that does not exist
- **THEN** the CLI prints `Error: path not found: <path>` and exits with code 1

### Requirement: CLI accepts multiple explicit file paths
When two or more file paths are passed to `livedown share`, the CLI SHALL include all of them in the session. If any path does not exist the CLI SHALL print an error and exit with code 1.

#### Scenario: Two files shared in one session
- **WHEN** the user runs `livedown share README.md CONTRIBUTING.md`
- **THEN** both files are watched and available in the browser under the same session URL

#### Scenario: Mixed valid and invalid paths exit with error
- **WHEN** the user runs `livedown share README.md missing.md`
- **THEN** the CLI prints `Error: file not found: missing.md` and exits with code 1

### Requirement: Watcher fans out to one chokidar watcher per file
For each file in the session, the watcher SHALL create an independent chokidar file watcher. A change to one file SHALL trigger a push only for that file; other files in the session SHALL NOT be pushed.

#### Scenario: Change to one file pushes only that file
- **WHEN** `intro.md` is modified on disk and `guide.md` is unchanged
- **THEN** a single `push` message with `file: "session-id/intro.md"` is sent and no push is sent for `guide.md`
