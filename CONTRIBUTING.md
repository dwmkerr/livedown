# Contributing

## Getting Started

```bash
git clone git@github.com:dwmkerr/livedown.git
cd livedown
npm install
npm run build
npm link
livedown share ./README.md
```

## Development

Run the relay locally:

```bash
npx partykit dev
```

In another terminal, share a file against the local relay:

```bash
PARTYKIT_HOST=localhost:1999 npx ts-node src/cli.ts share README.md
```

## Pull Requests

All PRs must follow conventional commit format for titles (e.g., `feat:`, `fix:`, `docs:`).

### Screenshots Required

- **UI changes** must include before/after screenshots showing the visual difference
- **CLI changes** should include before/after terminal screenshots for any non-trivial change (new output, changed prompts, modified formatting)

### PR Template

Use the standard summary format:

```markdown
## Summary
- Brief description of changes

## Screenshots
### Before
<!-- screenshot -->

### After
<!-- screenshot -->
```
