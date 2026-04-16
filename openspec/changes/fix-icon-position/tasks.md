## 1. Reorder Status Bar Element

- [ ] 1.1 In `public/index.html`, cut the GitHub icon `<a class="sb-seg">` element (currently between `#sb-edits-seg` and `#profile`)
- [ ] 1.2 Paste it as the last child of `#statusbar`, after `#sb-status`
- [ ] 1.3 Verify the inline `border-right:none` style on the element is still present (it remains correct as the terminal item)

## 2. Visual Verification

- [ ] 2.1 Open the viewer in a browser and confirm the GitHub icon appears at the far right of the status bar, after the connection status dot
- [ ] 2.2 Confirm no other status bar segments have shifted or lost their borders
