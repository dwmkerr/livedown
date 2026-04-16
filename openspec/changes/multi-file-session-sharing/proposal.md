## Why

Today `livedown share` accepts exactly one file per session. Teams writing documentation or tutorials across several markdown files must open a separate session (and share a separate URL) for each file, making it impractical to share a coherent set of related documents. Pointing livedown at a directory or a list of files and getting a single shareable URL would unlock that workflow.

## What Changes

- `livedown share` accepts a directory path or multiple file arguments in addition to a single file.
- A single session URL covers all files in the set; viewers can switch between files from the browser UI.
- The relay room tracks a keyed map of `{ [filename]: { content, meta, signature } }` rather than a single document state.
- The watcher monitors all files in scope and pushes per-file updates.
- The browser viewer renders a file-picker/tab strip and re-renders when the active file changes.
- The `push` / `update` WebSocket messages include a `file` key to route content to the correct slot.
- Each file shares the same Ed25519 keypair for the session (one edit key covers all files).

## Capabilities

### New Capabilities

- `multi-file-session`: Browser file-picker UI and per-file content routing across a single session URL.
- `directory-watch`: CLI accepts a directory or file list and fans out to one watcher per file.

### Modified Capabilities

- `single-file-share`: The existing share flow becomes a special case of multi-file sharing (single-element file set). CLI argument handling changes from `<file>` to `<paths...>`. **BREAKING** for scripts that relied on positional argument name semantics, but the single-file usage pattern `livedown share README.md` continues to work unchanged.

## Impact

- `src/cli.ts` — argument definition changes from single `<file>` to variadic `<paths...>`; directory expansion logic added.
- `src/watcher.ts` — `startWatcher` refactored to accept an array of file paths and manage a watcher per file.
- `src/party/livedown.ts` — room state changes from `latestContent`/`latestMeta` scalars to a `files` map; broadcast message includes `file` key.
- `public/index.html` — file-picker strip added to status bar; viewer listens for per-file updates.
- No new runtime dependencies anticipated; chokidar already supports multi-path watching.
