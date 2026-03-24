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
    <a href="https://codecov.io/gh/dwmkerr/livedown"><img src="https://codecov.io/gh/dwmkerr/livedown/graph/badge.svg" alt="codecov"></a>
  </p>
</p>

## Quickstart

```bash
npx @dwmkerr/livedown share ./your-file.md
```

Open the printed URL — anyone with the link sees your edits in real time and can edit the file as well.

> [!WARNING]
> **Work in Progress** — livedown exposes the contents of local files over the internet. Guardrails to prevent unintended file exposure are being developed. Use with caution and avoid sharing sensitive files.

## How It Works

```
 Your Machine          livedown.dev          Collaborator
 ┌──────────┐         ┌──────────┐          ┌──────────┐
 │ notes.md │◀───────▶│          │◀────────▶│ Browser  │
 └──────────┘         └──────────┘          └──────────┘
```

## Commands

### `livedown share <file>`

Watch a local file and share it live.

```bash
livedown share ./notes.md
```

### `livedown open <url>`

Open a shared document in the browser.

```bash
livedown open https://livedown.dwmkerr.partykit.dev/#abc123/notes.md
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
