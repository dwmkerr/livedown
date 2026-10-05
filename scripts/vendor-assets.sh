#!/usr/bin/env bash
#
# Download the viewer's third-party assets into public/vendor/.
#
# The viewer must render with no network access (livedown view serves it from
# localhost), so everything needed to parse and edit markdown is committed
# rather than fetched from a CDN at runtime.
#
# Not vendored, deliberately:
#   - Google Fonts: the CSS declares fallback stacks, so offline degrades to
#     system fonts with no loss of function.
#   - Mermaid: the ESM build dynamically imports 54+ chunks (multiple MB).
#     Diagrams need network; the rest of the page does not.
#
set -euo pipefail

cd "$(dirname "$0")/.."
VENDOR="public/vendor"

CODEMIRROR_VERSION="5.65.17"
MARKED_VERSION="15.0.12"
TWEETNACL_VERSION="1.0.3"
DOMPURIFY_VERSION="3.4.16"

mkdir -p "$VENDOR/codemirror"

fetch() {
  local url="$1" dest="$2"
  echo "  $dest"
  curl -sSfL "$url" -o "$dest"
}

echo "Vendoring viewer assets into $VENDOR"
fetch "https://cdn.jsdelivr.net/npm/marked@${MARKED_VERSION}/marked.min.js" \
      "$VENDOR/marked.min.js"
fetch "https://cdn.jsdelivr.net/npm/tweetnacl@${TWEETNACL_VERSION}/nacl-fast.min.js" \
      "$VENDOR/nacl-fast.min.js"
fetch "https://cdn.jsdelivr.net/npm/dompurify@${DOMPURIFY_VERSION}/dist/purify.min.js" \
      "$VENDOR/purify.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/codemirror.min.css" \
      "$VENDOR/codemirror/codemirror.min.css"
fetch "https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/codemirror.min.js" \
      "$VENDOR/codemirror/codemirror.min.js"
fetch "https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/mode/markdown/markdown.min.js" \
      "$VENDOR/codemirror/markdown.min.js"

# Record checksums so a later run (or CI) can prove the committed bytes still
# match what was fetched. curl alone offers no integrity guarantee.
( cd "$VENDOR" && find . -type f ! -name SHA256SUMS -exec shasum -a 256 {} + \
  | sort -k2 > SHA256SUMS )
echo "Wrote $VENDOR/SHA256SUMS"

echo "Done. Sizes:"
du -ch "$VENDOR" | tail -1
