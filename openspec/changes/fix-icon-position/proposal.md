## Why

The GitHub icon in the status bar currently appears to the left of the profile segment, breaking the visual grouping of right-side items. Moving it between the profile and the status dot creates a more logical left-to-right flow: identity (profile) → project link (GitHub) → connection state (dot).

## What Changes

- Reorder the three right-side status bar segments in `public/index.html` so the order becomes: `#profile` → GitHub icon link → `#sb-status` (dot + label).

## Capabilities

### New Capabilities
<!-- None — this is a pure layout reorder with no new behaviour -->

### Modified Capabilities
<!-- No spec-level behaviour changes; only visual ordering -->

## Impact

- `public/index.html` — move the `<a>` GitHub icon element (lines ~316–318) to sit between `#profile` and `#sb-status`.
- No JS, CSS, or server-side changes required.
- No breaking changes.
