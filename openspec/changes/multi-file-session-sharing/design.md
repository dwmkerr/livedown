## Context

livedown currently maps one CLI invocation to one PartyKit room. The room holds a single document state: `latestContent`, `latestMeta`, and a single `publicKey`. The watcher opens one WebSocket connection per session and signs pushes with a session-scoped Ed25519 key.

To support multiple files under one session URL the room state must become a keyed map, the wire protocol must carry a `file` identifier on every push/update, and the browser must be able to display and switch between files.

## Goals / Non-Goals

**Goals:**
- Single session URL covers N markdown files (directory or explicit list).
- Browser viewer shows a file-picker and re-renders on file selection.
- Watcher fans out to one chokidar watcher per file; each pushes with the same keypair.
- Relay room stores a `files` map keyed by `doc/filename` and broadcasts per-file updates.
- Existing single-file usage (`livedown share README.md`) continues to work unchanged.

**Non-Goals:**
- File creation or deletion during a live session (scope limited to files that exist at startup).
- Per-file access control or separate signing keys per file.
- Recursive directory traversal (one level only for directories).
- Binary or non-markdown file types.

## Decisions

### 1. Wire protocol: add `file` key to push/update messages

Current `push` message: `{ type, content, signature, meta }`.
Proposed: `{ type, content, signature, meta, file }` where `file` is the `doc/filename` string used as the map key.

Alternatives considered:
- Separate WebSocket connection per file: simpler state model but multiplies connections and authentication handshakes; rejected because one edit key covers the session.
- Sub-room per file (PartyKit room-per-file, single lobby room): cleanly isolated but complex fan-out logic and extra connection overhead; rejected as over-engineering for the expected file counts.

The chosen approach keeps the connection count at one per CLI session and requires only an additive change to the message schema.

### 2. Room state: `files` map replaces scalar state

`latestContent`/`latestMeta` become `files: Map<string, { content, meta, signature }>`.

The `onConnect` init message changes from `{ content, meta }` to `{ files, activeFile }` where `activeFile` is the most-recently-pushed file key (or the first file alphabetically on first connect).

Backward compatibility: old viewers receiving the new `init` shape will display nothing (they look for top-level `content`). This is acceptable because the server version bump will be accompanied by a viewer update.

### 3. CLI: variadic `<paths...>` argument with directory expansion

`livedown share <paths...>` — one or more files or one directory. When a directory is given, expand to all `*.md` files in that directory (non-recursive).

The existing test `livedown share README.md` becomes `paths = ["README.md"]`, preserving behaviour.

### 4. Watcher: array of `(filePath, doc)` pairs, shared keypair

`startWatcher` receives `files: Array<{ filePath: string; doc: string }>` plus the shared `editKey`/`publicKey`. It opens one WebSocket connection and one chokidar watcher per file. The `set-token` message is sent once on first `open`; subsequent watchers re-use the already-established token.

Alternative: single chokidar watcher on the directory — simpler but harder to map change events back to individual `doc` keys. Rejected.

### 5. Browser: file-picker strip in status bar

A horizontal scrollable strip of pill buttons replaces (or extends) the `#sb-file` segment. Clicking a pill sets the active file and re-renders the preview and source panes. No framework dependency; plain DOM manipulation consistent with the existing viewer code.

## Risks / Trade-offs

- **Message size**: Broadcasting the full content of every file on each update is fine for small document sets but could stress PartyKit's 1 MB message limit for large files. → Mitigation: validate total session size at `startSharing` time and warn if any file exceeds 800 KB.
- **Race conditions on init**: A new viewer connecting while files are being pushed may see a partial `files` map. → Mitigation: the watcher pushes all files once on WebSocket open before watching; the relay snapshot in `files` is always consistent at connection time.
- **Single-file backward compat**: Changing the `init` message shape is a soft breaking change for anyone running an old viewer against a new server. → Mitigation: new viewer is deployed with the server; the partykit.json version is bumped.

## Open Questions

- Should `livedown share <dir>` watch for new `.md` files added to the directory after startup, or only those present at launch? (Proposal defers this to a follow-up.)
- PartyKit free tier has a room connection limit; large teams viewing many files simultaneously may hit it. Worth profiling before launch.
