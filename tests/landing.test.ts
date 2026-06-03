import fs from "fs";
import path from "path";

const INDEX_HTML = fs.readFileSync(
  path.resolve(__dirname, "../public/index.html"),
  "utf8"
);

describe("public/index.html landing", () => {
  it("contains the diagram landing block", () => {
    expect(INDEX_HTML).toMatch(/<div id="landing">/);
    expect(INDEX_HTML).toMatch(/3 humans · 2 agents · 1 file/);
  });

  it("contains the system diagram canvas", () => {
    expect(INDEX_HTML).toMatch(/id="diag-outer"/);
    expect(INDEX_HTML).toMatch(/id="diag-inner"/);
    expect(INDEX_HTML).toMatch(/class="surface cursor"/);
    expect(INDEX_HTML).toMatch(/class="relay-card"/);
  });

  it("contains the viewer chrome alongside the landing", () => {
    expect(INDEX_HTML).toMatch(/id="header"/);
    expect(INDEX_HTML).toMatch(/id="panes"|id="cm-source"|CodeMirror/);
  });

  it("routes by location.hash", () => {
    expect(INDEX_HTML).toMatch(/location\.hash/);
    expect(INDEX_HTML).toMatch(/showLandingPage|initLandingUI/);
    expect(INDEX_HTML).toMatch(/hashchange/);
  });
});
