# Design

Canonical design direction for the livedown viewer chrome and landing page. Derived from the Claude Design bundle "Livedown Designs" — V2 Reader-primary (Header A, refined).

Update this doc when the design intent changes. Code that diverges from it is a bug.

## Principles

- **Ephemeral, developer-first.** Tool for short, high-trust sessions. No sign-in, no dashboards, no workspace concept. Session starts with `livedown share`, ends with `^C`.
- **Cursor-style mental model.** Code/Split/Preview toggle, keyboard-comfortable, monospace chrome where it earns it.
- **Light chrome, dark code.** Top bar and rendered preview are light. Source pane stays Catppuccin-adjacent dark.
- **Trust signals are first-class.** Lock state, editor pill, ed25519-verified footer are features, not warnings.

## Type and color

- **Mono:** JetBrains Mono (chrome labels, filename, code).
- **Sans:** Inter (rendered markdown, UI copy).
- **Dark palette (code pane):** Catppuccin Mocha — `--ld-bg #1e1e2e`, `--ld-blue #89b4fa`, `--ld-green #a6e3a1`, `--ld-pink #f38ba8`, `--ld-mauve #cba6f7`.
- **Light palette (chrome):** `#fff` surface, `#17171f` ink, `#3a3a48` secondary ink, `#8a8aa0` tertiary, `#e4e6eb` borders, `#f5f6f8` hover fill.
- **Accents:** `#22a355` live/editor green, `#e4c05c` / `#fffae8` locked amber, `#d9453d` offline red.

## Viewer header (V2 Reader-primary, Header A)

52px light bar. Three-column grid: `1fr auto 1fr`. No session timer, no "live" text, no owner/repo/last-edit strip.

**Left cluster**
1. GitHub icon link → repo.
2. `livedown` wordmark (mono, black) → `livedown.dev`.
3. Vertical separator.
4. Connection dot (green live / amber connecting / red offline) — subtle, to the left of the filename.
5. **Filename-as-copy-button.** Monospace, 14.5px (the largest type in the chrome). Default ink; on hover turns blue with a light blue fill, reveals a dim clipboard glyph on the right. Click copies the share URL and flashes green with a checkmark for 1.5s. No separate copy icon — the filename itself is the affordance.

**Center**
- Segmented Code / Split / Preview toggle. Persisted to `localStorage('livedown:mode')`. Default `split` (developer audience; source + rendered visible side-by-side).

**Right cluster**
1. Lock pill:
   - Protected + locked → `🔒 Locked · enter key` (amber, clickable, opens token modal).
   - Protected + unlocked → `🔓 Editor` (green rounded pill).
   - Unprotected → `Viewing` (subtle grey).
2. Roster cluster — stacked avatars (up to 3) + total count. Click opens popover:
   - Section **In this room** — each member with role (sharer · local file / editor · has key / viewer / you) and typing-or-idle status.
   - Section **Recent edits** — color-barred list, preview text, `who · time-ago`.
   - Footer (protected rooms only): `all changes ed25519-verified`.
3. Current user chip — `G{n}` label and avatar, colored from the palette keyed on guest id. White background for guests. (Reserved dark background for future signed-in state.)

## Mode semantics

- `preview` — rendered pane full width (reader primary).
- `split`   — source (dark) left, rendered (light) right, draggable divider.
- `code`    — source full width.

Switching never changes the header. Header owns identity and controls; body owns content.

## Guest numbering

Server assigns monotonically increasing guest id on connect. Client renders the avatar as `G{id}` (compact monogram) and the chip label as `Guest {id}` (readable). Edit attribution and roster keys use the long form `Guest {id}` — the short form is derived when rendering avatars. No sign-in state. Avatar color = `PALETTE[(id-1) % PALETTE.length]`.

## Roster data

Relay does not broadcast presence. Client derives members from messages it has seen (`init.meta.editor`, `update.meta.editor`, self). `typing` is a 1.4s trailing flag set when an edit is recorded. Any new presence signal added to the relay must populate the same `members` map.

## Dropped from prior designs

- Session duration timer.
- "Live" / "idle" text chips.
- "Edited 2s ago" above the document title — moved into the roster popover only.
- Inline join URL text — replaced with icon-only copy button.
- `sb-owner`, `sb-repo`, `sb-lastedit` status bar segments.

## Landing page

**Lives in `site/` — separate from the PartyKit relay deploy.** `site/index.html` is the landing page shipped to livedown.dev (the user-facing marketing surface). The relay (`public/`) hosts only the viewer and the not-found card. Keeping them split means marketing copy changes do not require a relay redeploy and vice-versa.

Content (dark Catppuccin chrome, follows design bundle hero). Page flow: hero → system diagram → commit ritual → security → footer.

- **Top nav** — `livedown` wordmark + npm version · Security · GitHub star button (live star count from api.github.com).
- **Hero** — pulsing blue pill `ephemeral · signed · zero-install` → headline *"Share a local markdown file, collaborate with many users and agents live, no account needed."* (opening clause white, tail dimmed) → `$ npx @dwmkerr/livedown share ./file.md` (copy button). Compact (≈40pt, no blurb paragraph, no tagline) so the system diagram sits high on the page.
- **System diagram** — boxes-and-lines centerpiece, fixed 1200×520 source canvas scaled uniformly to fit container width. Cursor IDE surface (LEADER, `livedown share`) on the left, browser viewer card (amy.chen typing, AC/JW/G3 roster) top-center, stateful relay card middle-center, Vim + Claude Code surface (JOINED, `livedown join`) on the right. Animated SVG packets travel the signed/broadcast/disk-write paths; protocol labels (`signed`, `→ disk`, `push`, `broadcast`) sit next to the connectors. Bottom caption: `✦ 3 humans · 2 agents · 1 file · in sync across 3 machines`.
- **Commit ritual** — single mono row directly below the diagram: `when you're done — $ ^C && git commit -am "spec: reviewed with @amy" → room evaporates, file is yours.`
- **Security** — "Three layers of verification" prose + keyword chip row + layer-verifies-rejects table.
- **Footer** — left: `livedown` wordmark linking to the GitHub repo. Right: `docs` · `github`. No MIT line, no author byline, no npm link — discovery routes through GitHub.

## Three-state routing

- **livedown.dev** (`site/`) — landing. No hash needed. Acts as the share-link target as well: a share URL of the form `https://livedown.dev/#<room>` is parsed by the viewer (`public/`) once the host points there, so the landing has no "Join a room" affordance — pasting any livedown URL into the browser address bar is the join path.
- **partykit.dev/#<doc>** (`public/`) — viewer. Client reads hash and opens WS. States: `loading` → `live` | `offline` | `notfound`.
- **partykit.dev** with no hash, or `notfound` after WS confirms no sharer ever — inline not-found card (dark surface, error heading, install command, primary CTA back to livedown.dev, secondary GitHub link). No separate file.

The old bundled landing that lived inside `public/index.html` is gone.

## Source of truth

Design bundles are committed under [`./design/`](../design/) as zip snapshots (`design-bundle-N.zip`). The canvas itself lives on claude.ai/design; the link is in [`design/README.md`](../design/README.md). Match the visual output of the prototypes, not their internal structure — they are HTML/CSS/JSX sketches, not React components for production.

Refresh by re-exporting from the canvas and dropping a new `design-bundle-N.zip` (incrementing N) so older snapshots stay available. Unpack on demand into `scratch/`; never commit the unpacked contents. Chat transcripts are intentionally not committed — intent lives in the canvas + this doc.

## Follow-ons

- **CLI terminal chrome.** Design bundle includes a richer terminal surface for `livedown share` output (framed pane, colored status lines, keybind hints). Not implemented yet — current CLI prints the legacy format. Parked until the viewer and landing are locked in.

## Changing the design

1. Update this doc with the new intent.
2. Change `public/index.html` to match.
3. Include before/after screenshots in the PR (see `CLAUDE.md`).
