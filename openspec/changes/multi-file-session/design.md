## Context

Livedown uses a PartyKit relay room per session. Today each room holds a single `latestContent` string plus its signature. The CLI starts one file watcher that signs and pushes that one file. The viewer receives a single blob and renders it.

The change multiplexes N files through the same room by keying content on filename. The signing/verification contract does not change — each file push carries its own independent Ed25519 signature over `(filename + content)`.

## Goals / Non-Goals

**Goals:**
- Multiple files share one room URL and one session keypair
- Single-file sessions are byte-for-byte compatible with existing relay and viewer
- Each file update is independently signed and verified end-to-end
- Viewer shows a tab bar only when more than one file is present

**Non-Goals:**
- Directory or glob watching (only explicit file paths)
- File ordering or grouping beyond the order supplied on the CLI
- Presence or awareness of which viewer tab is active (server-side)
- Live add/remove of files after the session starts

## Decisions

### 1. Message format — tagged envelope over multiplexed channel

Each push message becomes `{ type: "file-update", name: string, content: string, signature: string }` rather than separate PartyKit rooms or a custom binary protocol.

Alternatives considered:
- **Separate rooms per file**: would require multiple WebSocket connections in the viewer and a separate URL per file — breaks the "one link" goal.
- **Binary multiplexing**: unnecessary complexity; all content is text.

### 2. Relay state — `files` map replaces scalar `latestContent`

The room's durable state becomes `Map<name, { content, signature, updatedAt }>`. On new viewer connection the relay sends a `session-state` message with the full map so late joiners get all files immediately.

### 3. Signature scope includes filename

The signed payload is `name + ":" + content` (UTF-8). This prevents a malicious relay from swapping content between files while keeping signatures valid.

Alternatives considered:
- Sign content only: would allow cross-file replay attacks inside one session.
- Sign full message JSON: fragile against serialization order differences.

### 4. CLI variadic argument — existing single-file path still works

`livedown start <files...>` replaces `livedown start <file>`. When one file is given, behavior is identical. The watcher array has length 1 and sends the legacy-compatible single-file message shape for forward compatibility during a transition period.

### 5. Viewer tab bar — progressive enhancement

The viewer listens for `session-state` and `file-update` messages. It maintains a local `files` map. A tab bar is rendered only when `files.size > 1`. The active tab tracks the most-recently-updated file by default, with manual override.

## Risks / Trade-offs

- **Large sessions with many large files**: The `session-state` payload sent on every new connection grows linearly. Mitigation: document a soft limit (e.g., 10 files, each ≤1 MB); this is a dev/preview tool.
- **Relay compatibility**: Old relay instances expect scalar `latestContent`. Mitigation: deploy relay before updating CLI; old CLI keeps working against new relay because single-file sessions still work.
- **Tab bar UX on mobile**: tab overflow not designed. Mitigation: out of scope for this change; scrollable tabs can be added as a follow-up.

## Migration Plan

1. Deploy updated relay (`src/party/livedown.ts`) — backwards-compatible; old push format falls into `files` map under the original filename key.
2. Release updated CLI and viewer together in one version bump.
3. No rollback complexity: relay can serve old and new clients simultaneously.

## Open Questions

- Should the file name shown in the tab be the full path or just the basename? (Lean toward basename for readability, full path on hover.)
- Max files / max content size — codify in docs or enforce at relay level?
