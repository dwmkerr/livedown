import fs from "fs";
import path from "path";

const PUBLIC = path.resolve(__dirname, "../public");
const INDEX_HTML = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8");
const HEAD = INDEX_HTML.slice(0, INDEX_HTML.indexOf("<style>"));

describe("public/index.html assets", () => {
  it("renders markdown through DOMPurify", () => {
    // marked does not sanitize, and `livedown view` is pointed at documents the
    // user did not write. Losing this wrapper reintroduces XSS in the viewer.
    expect(INDEX_HTML).toMatch(/DOMPurify\.sanitize\(\s*marked\.parse\(/);
    expect(HEAD).toContain("/vendor/purify.min.js");
  });

  it("loads scripts and styles from vendor, not a CDN", () => {
    for (const asset of [
      "/vendor/marked.min.js",
      "/vendor/nacl-fast.min.js",
      "/vendor/purify.min.js",
      "/vendor/codemirror/codemirror.min.css",
      "/vendor/codemirror/codemirror.min.js",
      "/vendor/codemirror/markdown.min.js",
    ]) {
      expect(HEAD).toContain(asset);
      expect(fs.existsSync(path.join(PUBLIC, asset.replace(/^\//, "")))).toBe(
        true
      );
    }
    // Fonts and mermaid are the documented exceptions.
    const remote = (HEAD.match(/https:\/\/[^"']+/g) || []).filter(
      (u) => !/fonts\.(googleapis|gstatic)\.com/.test(u)
    );
    expect(remote).toEqual([]);
  });

  it("loads mermaid only when a document contains a diagram", () => {
    // Eagerly importing mermaid costs ~20 CDN requests on every page load.
    expect(HEAD).not.toContain("mermaid");
    expect(INDEX_HTML).toMatch(/function loadMermaid\(\)/);
  });

  it("shows the filename without the room id prefix", () => {
    // `view` prefixes the room with a capability token, which would otherwise
    // be rendered in the header and leak into screenshots.
    expect(INDEX_HTML).toMatch(
      /const fileName = docName\.split\('\/'\)\.pop\(\)/
    );
  });
});
