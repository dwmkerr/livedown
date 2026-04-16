## Context

The status bar in `public/index.html` has a flex layout with a spacer (`flex:1`) that pushes right-side elements to the edge. After the spacer the current DOM order is:

1. GitHub icon `<a>` (lines ~316–318)
2. `#profile` div (avatar + name + access)
3. `#sb-status` div (dot + label)

The desired order is: `#profile` → GitHub icon → `#sb-status`.

No JavaScript references the GitHub icon element by ID or class, and no CSS targets it positionally relative to its siblings. The reorder is a pure HTML edit.

## Goals / Non-Goals

**Goals:**
- Move the GitHub icon `<a>` element so it appears between `#profile` and `#sb-status` in the DOM.
- Keep all existing styles, attributes, and `href` values unchanged.

**Non-Goals:**
- Changing the GitHub icon's appearance, size, or colour.
- Altering the left-side status bar segments.
- Adding or removing any JavaScript behaviour.

## Decisions

**Decision: DOM reorder only, no CSS change**

Because the status bar uses `display:flex` with natural DOM order determining visual order, moving the element in HTML is sufficient. Using `order` CSS properties would add unnecessary complexity and make the layout harder to read.

## Risks / Trade-offs

- **Risk: None significant** — this is a single-file, single-element reorder. No logic, state, or API surface is affected.
- The `border-right:none` inline style on the GitHub `<a>` currently removes its right border because it is the last visual item before `#profile`. After the move, `#sb-status` becomes the last segment; verify the border treatment still looks correct. If needed, move the `border-right:none` style to `#sb-status` instead.
