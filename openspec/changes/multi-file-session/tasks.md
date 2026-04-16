## 1. Relay — multi-file state and messaging

- [ ] 1.1 Replace scalar `latestContent` with a `files: Map<string, { content, signature, updatedAt }>` in `src/party/livedown.ts`
- [ ] 1.2 Update incoming message handler to expect `{ type: "file-update", name, content, signature }` and store in the map
- [ ] 1.3 Verify each incoming signature against `name + ":" + content` before storing; discard on failure
- [ ] 1.4 Send `{ type: "session-state", files: <serialised map> }` to each viewer on connect
- [ ] 1.5 Broadcast `{ type: "file-update", name, content, signature }` to all viewers on each valid update

## 2. Watcher — multi-file watching and tagged pushes

- [ ] 2.1 Update `src/watcher.ts` to accept and iterate over an array of file paths
- [ ] 2.2 Sign each push over `name + ":" + content` (basename as name)
- [ ] 2.3 Send `{ type: "file-update", name, content, signature }` per file on change
- [ ] 2.4 Verify incoming `file-update` messages from relay using the same `name + ":" + content` payload

## 3. CLI — variadic file arguments

- [ ] 3.1 Update `src/cli.ts` argument parser to accept variadic `<files...>` instead of a single `<file>`
- [ ] 3.2 Validate that at least one file path is provided; print usage error and exit non-zero otherwise
- [ ] 3.3 Pass the array of paths to the watcher initialisation

## 4. Viewer — tab bar UI

- [ ] 4.1 Update `public/index.html` WebSocket message handler to process `session-state` and `file-update` message types
- [ ] 4.2 Maintain a local `files` map in viewer JS; track active tab name
- [ ] 4.3 Render tab bar only when `files.size > 1`; hide tab bar for single-file sessions
- [ ] 4.4 Implement tab click handler to switch active file and re-render markdown
- [ ] 4.5 On `file-update` received, update the map entry and switch active tab to the updated file

## 5. Testing and validation

- [ ] 5.1 Manual test: single-file session — confirm no tab bar, identical behaviour to current
- [ ] 5.2 Manual test: two-file session — confirm tab bar, tab switching, and live updates on both files
- [ ] 5.3 Verify signature rejection: tamper with `name` field and confirm relay discards message
- [ ] 5.4 Verify late-join: connect a second viewer after files have been pushed and confirm all files appear immediately
- [ ] 5.5 Update README "How It Works" architecture section to reflect multi-file relay state and viewer tab bar
