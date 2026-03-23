<p align="center">
  <h2 align="center"><code>📝 livedown</code></h2>
  <h3 align="center">Edit markdown locally, share it live in a browser.</h3>
  <p align="center">
    <a href="#quickstart">Quickstart</a> |
    <a href="#installation">Installation</a> |
    <a href="#how-it-works">How It Works</a> |
    <a href="#configuration">Configuration</a> |
    <a href="#deploy-your-own-relay">Deploy Your Own</a>
  </p>
  <p align="center">
    <a href="https://github.com/dwmkerr/livedown/actions/workflows/cicd.yaml"><img src="https://github.com/dwmkerr/livedown/actions/workflows/cicd.yaml/badge.svg" alt="cicd"></a>
    <a href="https://www.npmjs.com/package/@dwmkerr/livedown"><img src="https://img.shields.io/npm/v/%40dwmkerr/livedown" alt="npm version"></a>
  </p>
</p>

## Quickstart

```bash
npx @dwmkerr/livedown ./your-file.md
```

Open the printed URL — anyone with the link sees your edits in real time.

> [!WARNING]
> **Work in Progress** — livedown exposes the contents of local files over the internet. Guardrails to prevent unintended file exposure are being developed. Use with caution and avoid sharing sensitive files.

## Installation

```bash
npm install -g @dwmkerr/livedown
```

Then run:

```bash
livedown ./your-file.md
```

Options:

```bash
livedown ./notes.md --doc my-notes --editor "Dave Kerr"
livedown ./notes.md --relay your-relay.partykit.dev
```

## How It Works

- A local file watcher detects changes and pushes them to a [PartyKit](https://partykit.io) relay via WebSocket
- Viewers connect to the relay and see updates in ~200ms
- Browser viewers get a split-pane editor (CodeMirror + live preview) and can push changes back
- Changes from the browser are written back to your local file automatically

## Configuration

| Env var | CLI flag | Default |
|---------|----------|---------|
| `PARTYKIT_HOST` | `--relay` | `livedown.dwmkerr.partykit.dev` |
| `LIVEDOWN_EDITOR` | `--editor` | `os.hostname()` |
| `LIVEDOWN_PASSWORD` | `--password` | (none) |

## Deploy Your Own Relay

```bash
livedown deploy
```

This shows you how to deploy your own PartyKit relay. Then point livedown at it:

```bash
livedown ./notes.md --relay your-relay.partykit.dev
```

## Developer Guide

```bash
git clone git@github.com:dwmkerr/livedown.git
cd livedown
npm install
npm run build
npm link
livedown ./README.md
```

## License

MIT
