---
title: "README"
---
<p align="center">
  <h2 align="center"><code>📝 livedown</code></h2>
  <h3 align="center">Edit markdown locally, share it live in a browser.</h3>
  <p align="center">
    <a href="#quickstart">Quickstart</a> |
    <a href="#how-it-works">How It Works</a> |
    <a href="#commands">Commands</a>
  </p>
  <p align="center">
    <a href="https://github.com/dwmkerr/livedown/actions/workflows/cicd.yaml"><img src="https://github.com/dwmkerr/livedown/actions/workflows/cicd.yaml/badge.svg" alt="cicd"></a>
    <a href="https://www.npmjs.com/package/@dwmkerr/livedown"><img src="https://img.shields.io/npm/v/%40dwmkerr/livedown" alt="npm version"></a>
  </p>
</p>

## Quickstart

```bash
npx @dwmkerr/livedown share ./your-file.md
```

Open the printed URL — anyone with the link sees your edits in real time.

> [!WARNING]
> **Work in Progress** — livedown exposes the contents of local files over the internet. Guardrails to prevent unintended file exposure are being developed. Use with caution and avoid sharing sensitive files.

## How It Works

- A local file watcher detects changes and pushes them to a relay via WebSocket
- Viewers connect to the relay and see updates in ~200ms
- Browser viewers get a split-pane editor (CodeMirror + live preview) and can push changes back
- Changes from the browser are written back to your local file automatically

## Commands

### `livedown share <file>`

Watch a local file and share it live.

```bash
livedown share ./notes.md
```

### `livedown join <url>`

Open a shared document in the browser.

```bash
livedown join https://livedown.dwmkerr.partykit.dev/#notes
```

## Developer Guide

```bash
git clone git@github.com:dwmkerr/livedown.git
cd livedown
npm install
npm run build
npm link
livedown share ./README.md
```

## License

MIT
