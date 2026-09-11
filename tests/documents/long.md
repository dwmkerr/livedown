# Sync-scroll smoke test

A long markdown document for verifying that scrolling the CodeMirror source pane and the rendered preview pane stay in sync.

## Section 1 — Introduction

This is the first paragraph. It is intentionally long enough to wrap multiple times on a typical viewport so that we have something to actually scroll. Sync should align the topmost visible source line with the rendered block that contains it.

Another paragraph. The mapping is best-effort: a paragraph that spans many source lines becomes one rendered block, so we anchor at block boundaries and interpolate between them.

- A bullet
- Another bullet
- And a third bullet, with a bit more text so that the list is taller than a single line of source

## Section 2 — Code

Some prose between sections.

```js
function example() {
  // A fenced code block adds vertical real estate to the preview
  // while being one logical block.
  for (let i = 0; i < 10; i++) {
    console.log('hello', i);
  }
}
```

More prose between code blocks.

```python
def quick_sort(items):
    if len(items) <= 1:
        return items
    pivot = items[0]
    less = [x for x in items[1:] if x <= pivot]
    more = [x for x in items[1:] if x >  pivot]
    return quick_sort(less) + [pivot] + quick_sort(more)
```

## Section 3 — Table

A table to test row-level alignment:

| column a | column b | column c |
|----------|----------|----------|
| one      | two      | three    |
| four     | five     | six      |
| seven    | eight    | nine     |
| ten      | eleven   | twelve   |

## Section 4 — Blockquote

> A blockquote spans several lines.
>
> It renders as a single block but covers a contiguous range of source lines, so interpolation across it should feel smooth.

## Section 5 — Headings

### Subhead one

Some text under subhead one.

### Subhead two

Some text under subhead two.

### Subhead three

Some text under subhead three.

## Section 6 — More content

Paragraph A. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

Paragraph B. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Paragraph C. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

Paragraph D. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

---

## Section 7 — End

A horizontal rule separates this from the previous section. Scrolling the preview pane back up should pull the source back up by the same fraction.

End of document.
