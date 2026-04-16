## Context

The status bar (`#statusbar`) in `public/index.html` is a flex row. Items flow left to right: branding, file info, join link, optional metadata segments, a `flex:1` spacer, then right-aligned items (edits badge, GitHub icon, profile, status dot). The GitHub icon currently sits between the edits badge and the profile widget rather than at the far right edge.

## Goals / Non-Goals

**Goals:**
- GitHub icon is the rightmost element in `#statusbar`.
- No visual regression on other status bar elements.

**Non-Goals:**
- Restyling the icon or changing its link target.
- Touching any other UI component (landing page, panes, modals).

## Decisions

**Reorder the element in HTML, not via CSS.**
The GitHub icon `<a class="sb-seg">` is currently the fifth item from the right. Moving it to be the last child of `#statusbar` (after `#sb-status`) achieves the goal with a single cut-and-paste. No new CSS rules are required — the existing `border-right:none` inline style on the element remains correct because it is still the last visual segment.

Alternative considered: using `order` CSS property on the existing element. Rejected — reordering in the DOM is clearer and avoids invisible CSS that could confuse future maintainers.

## Risks / Trade-offs

- [Minimal regression surface] The change touches one HTML file in one place → Mitigation: visual review before merge.
