## Why

The GitHub icon in the status bar sits between the edits badge and the profile widget, breaking the visual grouping — branding belongs at the far right edge, not mid-bar. Moving it to the rightmost position gives the bar a cleaner left-to-right information hierarchy.

## What Changes

- Move the GitHub icon `<a>` element in `public/index.html` to be the last child of `#statusbar`, after the connection status segment (`#sb-status`).
- Adjust inline border styles so the icon remains borderless as the terminal item.

## Capabilities

### New Capabilities
- `status-bar-icon-position`: GitHub icon renders as the rightmost item in the status bar.

### Modified Capabilities
<!-- none — no existing spec-level requirements are changing -->

## Impact

- `public/index.html`: single element reorder within `#statusbar`; no logic, no dependency, no API changes.
