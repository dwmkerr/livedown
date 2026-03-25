<p align="center">
  <h2 align="center"><code>📝 livedown</code></h2>
  <h3 align="center">Share a local markdown file and collaborate live in a browser and across machines.</h3>
  <p align="center">
    <a href="#quickstart">Quickstart</a> |
    <a href="#how-it-works">How It Works</a> |
    <a href="#commands">Commands</a>
  </p>



  <p align="center">
    <a href="https://github.com/dwmkerr/livedown/actions/workflows/cicd.yaml"><img src="https://github.com/dwmkerr/livedown/actions/workflows/cicd.yaml/badge.svg" alt="cicd"></a>
    <a href="https://www.npmjs.com/package/@dwmkerr/livedown"><img src="https://img.shields.io/npm/v/%40dwmkerr/livedown" alt="npm version"></a>
    <a href="https://codecov.io/gh/dwmkerr/livedown"><img src="https://codecov.io/gh/dwmkerr/livedown/graph/badge.svg" alt="codecov"></a>
  </p>
</p>

## Quickstart

```bash
npx @dwmkerr/livedown share ./your-file.md
```

Open the printed URL — anyone with the link can view your document in real time. To edit, they need the edit key.

## Commands

### `livedown share <file>`

Watch a local file and share it live.

```bash
livedown share ./notes.md
```

Options:
- `-r, --relay <host>` — Relay host (default: `livedown.dwmkerr.partykit.dev`)
- `-e, --editor <name>` — Your name shown to viewers
- `-k, --edit-key <key>` — Edit key (auto-generated if omitted)

### `livedown open <url>`

Open a shared document in the browser.

```bash
livedown open https://livedown.dwmkerr.partykit.dev/#abc123/notes.md
```

## How It Works

```
 Your Machine             Relay (PartyKit)          Collaborator
 ┌──────────┐            ┌──────────────┐          ┌──────────┐
 │ notes.md │───signed──▶│  Verify sig  │──update─▶│ Browser  │
 │          │◀──verify───│  Broadcast   │◀─signed──│          │
 └──────────┘            └──────────────┘          └──────────┘
   watcher                 Cloudflare                viewer
   (Node.js)               Workers                   (HTML)
```

Livedown has three components:

1. **CLI / Watcher** (`src/cli.ts`, `src/watcher.ts`) — watches a local markdown file for changes, pushes signed updates to the relay via WebSocket, and writes verified incoming updates to disk.

2. **Relay** (`src/party/livedown.ts`) — a [PartyKit](https://partykit.io) server running on Cloudflare Workers. Accepts WebSocket connections, verifies Ed25519 signatures on push messages, and broadcasts verified updates to all connected clients.

3. **Browser Viewer** (`public/index.html`) — renders the shared markdown with live preview and a CodeMirror editor. Viewers can read freely; editing requires the edit key.

### Key Libraries

| Library | Used In | Purpose |
|---------|---------|---------|
| [tweetnacl](https://github.com/nickolay/nickolay/tweetnacl-js) | CLI, watcher, browser (CDN) | Ed25519 signing and verification |
| [@noble/curves](https://github.com/paulmillr/noble-curves) | Relay | Ed25519 verification (pure ESM, Cloudflare Workers compatible) |
| [PartyKit](https://partykit.io) | Relay | WebSocket relay infrastructure on Cloudflare Workers |
| [CodeMirror](https://codemirror.net) | Browser | Markdown editor |
| [marked](https://marked.js.org) | Browser | Markdown to HTML rendering |
| [chokidar](https://github.com/paulmillr/chokidar) | Watcher | File system change detection |
| [commander](https://github.com/tj/commander.js) | CLI | Command-line argument parsing |

### Security

Livedown uses **Ed25519 asymmetric signing** to protect the sharer's local files from unauthorized edits.

When the sharer runs `livedown share`, the CLI generates an Ed25519 keypair:

- **Edit key** (private key seed, 64 hex chars) — shared only with trusted editors
- **Public key** — sent to the relay and broadcast to all viewers

Every push message is signed with the private key. Three independent verification points enforce authorization:

| Layer | Has | Verifies | Rejects |
|-------|-----|----------|---------|
| **Relay** | Public key | Signature on every push | Unsigned or invalid pushes are never broadcast |
| **Watcher** | Private key (derives public key) | Signature on incoming updates | Forged updates are never written to disk |
| **Browser** | Public key (from relay) | Edit key matches public key on entry | Wrong key is rejected before any push |

This means even a compromised relay cannot forge updates that the local watcher would accept — the watcher independently verifies every signature before writing to disk.

### PartyKit and Cloudflare Workers

The relay runs on [PartyKit](https://partykit.io), which deploys to [Cloudflare Workers](https://workers.cloudflare.com). The relay uses [@noble/curves](https://github.com/paulmillr/noble-curves) for Ed25519 signature verification — a pure ESM library with no Node.js dependencies that bundles cleanly in Cloudflare's esbuild pipeline.

The CLI and browser use [tweetnacl](https://github.com/nickolay/nickolay/tweetnacl-js) for Ed25519 operations. Both libraries implement RFC 8032 Ed25519 and produce compatible signatures.

Rooms are ephemeral — they exist only while connections are active and have no persistent storage. The public key is held in memory for the room's lifetime and must be re-registered on each sharing session.

## Developer Guide

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
