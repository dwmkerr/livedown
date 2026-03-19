# livedown

Edit markdown locally. Share it live.

## Quickstart

Install dependencies and watch a file:

```bash
npm install
```

```bash
PARTYKIT_HOST=livedown.dwmkerr.partykit.dev \
  LIVEDOWN_EDITOR="Your Name" \
  node watcher.js ./your-file.md doc-name
```

Open **https://livedown.dwmkerr.partykit.dev/#doc-name** — edit the file, viewers see changes in real time.

## How It Works

- Local watcher detects file saves and pushes rendered markdown to a [PartyKit](https://partykit.io) relay
- Viewers open the URL and receive live updates via WebSocket — no page refresh
- Anyone with the URL can open the split-pane view (raw markdown left, rendered right) and edit collaboratively
- Edits from the browser sync back to the local file automatically

## Structure

| Path | Purpose |
|------|---------|
| `watcher.js` | Local file watcher — run this on your machine |
| `party/livedown.ts` | PartyKit relay room — deployed to partykit.dev |
| `public/index.html` | Browser viewer — served by PartyKit |

## Deploying Your Own Relay

```bash
npm install
npx partykit deploy
```

Then set `PARTYKIT_HOST` to your deployed URL.

## Frontmatter

Add metadata to any watched file:

```yaml
---
owner: "Your Name"
github_repo: "https://github.com/you/repo"
title: "Document Title"
---
```

Shown in the browser status bar alongside last-editor and connection state.
