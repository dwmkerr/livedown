## Why

Today `livedown share` accepts a single file — one file, one session URL. Users who want to share multiple related documents must run separate sessions with separate URLs. Issue #18 requests the ability to point livedown at a directory or list of files and have all of them available under one session URL, with viewers switching between files in the browser and the watcher syncing all of them.

## What Changes

- The `livedown share` command accepts either a single file (existing behavior) or a directory/list of files as input.
- The watcher monitors all files in the session and pushes signed updates per file, including a `file` identifier in each message.
- The relay room holds a map of file names to their latest content, signing keys, and metadata, rather than a single document state.
- The browser viewer displays a file picker or tab bar that lets viewers switch between files in the session without navigating to a different URL.
- A single session URL covers all files; the URL fragment identifies the session, not an individual file.
- The edit key remains per-session — one keypair signs pushes for all files in the session.

## Capabilities

### New Capabilities

- `multi-file-session`: Session-level sharing of multiple markdown files under a single URL, including watcher support for multiple files, relay state keyed by file, and browser-side file navigation.

### Modified Capabilities

- None — no existing spec files exist in `openspec/specs/` to modify.

## Impact

- `src/cli.ts` — `share` command argument parsing extended to accept a directory path or multiple file arguments.
- `src/watcher.ts` — `startWatcher` refactored to accept multiple file paths; each file change results in a signed push that includes the file identifier.
- `src/party/livedown.ts` — room state changes from a single `latestContent`/`latestMeta` pair to a `Map<string, { content, meta }>` keyed by file name; `init` message delivers the full file map to new connections.
- `public/index.html` — browser viewer gains a file list/tab bar UI component; `init` and `update` message handling updated to operate per-file.
- No new dependencies anticipated; existing signing libraries (tweetnacl, @noble/curves) are unchanged.
