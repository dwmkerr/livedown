## 1. Wire Protocol & Relay

- [ ] 1.1 Add `file` field to `push` and `update` message types in `src/party/livedown.ts`
- [ ] 1.2 Replace `latestContent`/`latestMeta` scalars with a `files: Map<string, { content, meta, signature }>` in the room class
- [ ] 1.3 Update `onConnect` to send `{ type: "init", files, activeFile, guestId, protected, publicKey }` instead of scalar fields
- [ ] 1.4 Update `onMessage` push handler to upsert into `files` map and broadcast with `file` key
- [ ] 1.5 Verify that an invalid-signature push for any file still returns `auth-error` and broadcasts `auth-rejected`

## 2. CLI Argument Handling

- [ ] 2.1 Change `share` command argument from `<file>` to `<paths...>` (variadic) in `src/cli.ts`
- [ ] 2.2 Add `expandPaths(paths: string[]): string[]` helper that resolves directories to `*.md` files and validates all paths exist
- [ ] 2.3 Error and exit with code 1 when a path does not exist or a directory contains no markdown files
- [ ] 2.4 Update `startSharing` to accept `string[]` and pass the expanded list to `startWatcher`
- [ ] 2.5 Update the zero-argument interactive prompt to ask `File or directory to share:`
- [ ] 2.6 Update the CLI output to print `Watching N files` (or `Watching <path>` for single-file sessions)

## 3. Watcher Refactor

- [ ] 3.1 Change `startWatcher` signature to accept `files: Array<{ filePath: string; doc: string }>` plus shared `editKey`/`publicKey`
- [ ] 3.2 Open one chokidar watcher per file; on change push only the changed file with its `doc` key
- [ ] 3.3 Send `set-token` once on WebSocket `open`; push initial content for all files
- [ ] 3.4 Ensure `ignoreNextWrite` is tracked per-file to avoid re-push loops on remote updates

## 4. Browser Viewer

- [ ] 4.1 Add a scrollable file-picker pill strip to the status bar in `public/index.html`
- [ ] 4.2 On `init` message, populate the pill strip from `files` keys and set `activeFile`
- [ ] 4.3 On `update` message, update the local `files` map entry; re-render panes only if the updated file is the active file
- [ ] 4.4 On pill click, set `activeFile` and re-render source and preview panes
- [ ] 4.5 Hide the pill strip (or show a single label) when the session contains exactly one file, preserving the existing single-file UI

## 5. Tests & Validation

- [ ] 5.1 Update `src/cli.test.ts` to cover multi-path expansion and error cases
- [ ] 5.2 Add watcher unit tests for per-file push isolation
- [ ] 5.3 Add relay unit/integration tests for `files` map state and per-file broadcast
- [ ] 5.4 Run `openspec validate multi-file-session-sharing --strict` and confirm it passes
- [ ] 5.5 Manual smoke test: share a two-file directory, verify both files appear in browser and live updates work
