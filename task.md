# Task: Scaffold and publish the livedown repo

## Context

This repo was just created at https://github.com/dwmkerr/livedown (private).

`livedown` is a tool for editing markdown locally and sharing it live in a browser — no tunnel, no exposed ports. A local file watcher pushes changes to a PartyKit relay; viewers connect via WebSocket and see updates in ~200ms. Browser viewers can also edit and push changes back to the local file.

A working prototype already exists at:
```
/Users/Dave_Kerr/tasks/task--livedown/prototype/party-prototype/
```

The PartyKit relay is already deployed and live at:
```
https://livedown.dwmkerr.partykit.dev
```

## What Needs Doing

### 1. Clone the repo
```bash
git clone git@github.com:dwmkerr/livedown.git ~/repos/github/dwmkerr/livedown
cd ~/repos/github/dwmkerr/livedown
```

### 2. Study the newer dwmkerr CLI style

Look at these repos for style conventions (NOT boxes — it's outdated):
- `~/repos/github/dwmkerr/terminal-ai` — TypeScript CLI, commander, `@dwmkerr/` scoped package
- `~/repos/github/dwmkerr/shellwright` — MCP server + CLI, TypeScript, similar README style
- `~/repos/github/dwmkerr/git-workforest` — recent CLI

Key patterns to follow:
- `<p align="center">` header block with emoji, tagline, nav links, badges
- TypeScript + Jest + ESLint (same tsconfig/eslint as terminal-ai or shellwright)
- `@dwmkerr/livedown` scoped npm package
- `bin: { livedown: "dist/cli.js" }`
- `commander` for CLI argument parsing
- CI/CD via `.github/workflows/cicd.yaml` (see terminal-ai or shellwright for reference)
- release-please for versioning

### 3. Copy prototype source files

Copy from `/Users/Dave_Kerr/tasks/task--livedown/prototype/party-prototype/`:

```
party/livedown.ts     → src/party/livedown.ts   (PartyKit room)
public/index.html     → public/index.html        (browser viewer)
watcher.js            → src/watcher.ts           (convert to TypeScript)
partykit.json         → partykit.json
```

### 4. Structure to build

```
livedown/
├── src/
│   ├── cli.ts              # CLI entry: livedown start <file> [--doc <name>] [--relay <url>]
│   ├── watcher.ts          # Local file watcher (from prototype watcher.js)
│   └── party/
│       └── livedown.ts     # PartyKit room (already deployed)
├── public/
│   └── index.html          # Browser viewer (split pane, status bar, guest identity)
├── partykit.json           # Points to src/party/livedown.ts, serves public/
├── .github/
│   └── workflows/
│       └── cicd.yaml       # Build, test, lint on PR + main
├── package.json
├── tsconfig.json
├── .eslintrc.json
├── .gitignore
├── LICENSE
└── README.md
```

### 5. CLI interface to implement

```bash
# Start watching a file
livedown start ./notes.md

# With options
livedown start ./notes.md --doc my-notes --relay livedown.dwmkerr.partykit.dev --editor "Dave Kerr"

# Deploy your own relay
livedown deploy
```

The `start` command should:
1. Determine doc name from filename if not provided
2. Connect to the PartyKit relay (default: `livedown.dwmkerr.partykit.dev`)
3. Start the file watcher
4. Print the viewer URL to stdout

### 6. README style

Follow `terminal-ai` and `shellwright` README pattern:
- `<p align="center">` header with `📝 livedown` emoji + tagline
- Nav links: Quickstart | How It Works | Structure | Deploy Your Own
- Badges: cicd, npm version
- Quickstart in 2 commands max:

```bash
npm install -g @dwmkerr/livedown
livedown start ./your-file.md
```

Then open the printed URL.

- Brief "How It Works" section (4 bullet points max)
- "Deploy Your Own Relay" section showing `livedown deploy`

### 7. Environment / config

The CLI should read config from env vars (with CLI flag overrides):

| Env var | CLI flag | Default |
|---------|----------|---------|
| `PARTYKIT_HOST` | `--relay` | `livedown.dwmkerr.partykit.dev` |
| `LIVEDOWN_EDITOR` | `--editor` | `os.hostname()` |
| `LIVEDOWN_PASSWORD` | `--password` | (none) |

### 8. Key files for reference

**Prototype watcher** (convert to TypeScript):
`/Users/Dave_Kerr/tasks/task--livedown/prototype/party-prototype/watcher.js`

**PartyKit room** (already TypeScript):
`/Users/Dave_Kerr/tasks/task--livedown/prototype/party-prototype/party/livedown.ts`

**Browser viewer** (static HTML, no changes needed):
`/Users/Dave_Kerr/tasks/task--livedown/prototype/party-prototype/public/index.html`

**Architecture doc** (context on how it all fits):
`/Users/Dave_Kerr/tasks/task--livedown/prototype/architecture.md`

## Done When

- [x] `npm install && npm run build` succeeds
- [x] `livedown ./some-file.md` connects to relay and prints viewer URL
- [ ] Editing the file updates the browser in real time (needs manual test)
- [x] README matches dwmkerr style (terminal-ai / shellwright)
- [x] CI passes on PR
- [x] No secrets committed
- [ ] Merge PR #1 to main, CI passes on main

## Next

- [ ] `npx @dwmkerr/livedown share ./file.md` works — publish to npm (needs NPM_TOKEN secret)
- [ ] Security guardrails for file exposure (WIP section in README)
- [x] Room name collisions — fixed: each session gets a unique 6-char ID prefix (e.g. `a3f2k1/readme`), `--doc` overrides for stable names

## Future

- [ ] `livedown deploy` — let users deploy their own PartyKit relay and use `--relay` to point at it
- [ ] Sign in with GitHub — authenticate viewers via GitHub OAuth, show real names/avatars instead of Guest N, tie rooms to GitHub identity
- [ ] Persistence — save document state across relay restarts
- [ ] Editor integrations — VS Code extension, Cursor extension, Vim plugin
- [ ] Drop in a GitHub URL (PR, issue, repo link) and render it live
- [ ] `livedown join` — sync a local file from a remote session (reverse of share)

## Notes

- The npm package `livedown` is taken (old, abandoned, 8 years). Publish as `@dwmkerr/livedown`.
- The `@livedown` Twitter/X handle appears available.
- `livedown.live` domain is available (~$2.98/yr on Namecheap) — worth grabbing.
- PartyKit was acquired by Cloudflare in 2024 — very low risk of it going away.
- Coupling to PartyKit is minimal: only `src/party/livedown.ts` uses their API. The watcher and browser use plain WebSocket. Migrating = swap URL + rewrite that one file.
