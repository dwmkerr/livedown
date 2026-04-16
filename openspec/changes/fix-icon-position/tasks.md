## 1. Reorder Status Bar Elements

- [ ] 1.1 In `public/index.html`, move the GitHub icon `<a>` element (currently before `#profile`) to immediately after the closing `</div>` of `#profile` and before `<div id="sb-status">`
- [ ] 1.2 Verify that `border-right:none` inline style is appropriate on its new last-before-status position; if the status dot segment now needs the borderless treatment instead, move the style accordingly

## 2. Visual Verification

- [ ] 2.1 Open `public/index.html` in a browser and confirm the right-side order is: profile → GitHub icon → status dot
- [ ] 2.2 Confirm no visual regressions on the left-side segments or the overall statusbar layout
