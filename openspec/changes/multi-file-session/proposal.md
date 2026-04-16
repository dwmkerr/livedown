## Why

Livedown currently supports sharing only a single markdown file per session, requiring users to open separate sessions and URLs for each file. Supporting multiple files in one session eliminates this friction and enables natural multi-document workflows (e.g., sharing a README alongside a CHANGELOG or a set of related docs in one link).

## What Changes

- CLI `livedown start` accepts variadic `<files...>` argument instead of a single file path (backwards-compatible: single-file usage unchanged)
- Watcher manages an array of file paths; each push message is tagged with a filename identifier
- Relay room stores `files: Map<name, {content, meta, signature}>` replacing the single `latestContent` field
- Viewer renders a tab bar when more than one file is present; single-file sessions look identical to today
- Security model unchanged: one Ed25519 keypair per session covers all files; each push is signed independently

## Capabilities

### New Capabilities

- `multi-file-session`: Multiplex N markdown files through one session room with per-file tagging, relay storage, and viewer tab switching

### Modified Capabilities

- (none — single-file session behavior is fully preserved)

## Impact

- **`src/cli.ts`**: variadic argument parsing for `<files...>`
- **`src/watcher.ts`**: iterate over file array; tag outgoing messages with filename; verify incoming updates per file
- **`src/party/livedown.ts`**: replace scalar `latestContent` with `files` map; broadcast tagged updates
- **`public/index.html`**: tab bar UI component; file-switch logic; single-file fallback path
- **No new dependencies** — existing tweetnacl / @noble/curves cover signing for all files
- **No breaking changes** — single-file callers see no difference in CLI, URL scheme, or viewer UI
