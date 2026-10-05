// End-to-end check of `livedown view`: static serving, live reload, and the
// browser->disk writeback path with unsigned pushes.
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const WebSocket = require("ws");
const matter = require("gray-matter");
const os = require("os");
const path = require("path");

const PORT = 7777;
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "livedown-verify-"));
const FILE = path.join(TMP, "view-test.md");
const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = (p) =>
  new Promise((res) => {
    http
      .get(`http://127.0.0.1:${PORT}${p}`, (r) => {
        let b = "";
        r.on("data", (d) => (b += d));
        r.on("end", () =>
          res({
            status: r.statusCode,
            body: b,
            type: r.headers["content-type"],
            csp: r.headers["content-security-policy"],
            nosniff: r.headers["x-content-type-options"],
          })
        );
      })
      .on("error", (e) => res({ status: 0, body: String(e) }));
  });

(async () => {
  fs.writeFileSync(FILE, "# Original\n\nFrom disk.\n");
  const cli = spawn(
    "node",
    ["dist/cli.js", "view", FILE, "--port", String(PORT), "--no-open"],
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  let out = "";
  cli.stdout.on("data", (d) => (out += d));
  cli.stderr.on("data", (d) => (out += d));

  await sleep(2500);
  // The room name carries an unguessable token, so read it back from stdout.
  // The CLI styles the URL, so strip ANSI escapes before matching.

  const plain = out.replace(
    /\x1b\[[0-9;]*m|\x1b\]8;;[^\x07\x1b]*(\x07|\x1b\\)/g,
    ""
  );
  const urlMatch = plain.match(/http:\/\/127\.0\.0\.1:\d+\/#([^\s)]+)/);
  const DOC = urlMatch ? urlMatch[1] : "";
  const WS_URL = `ws://127.0.0.1:${PORT}/parties/main/${encodeURIComponent(DOC)}`;
  check(
    "room name is token-prefixed and unguessable",
    /^[0-9a-f]{16}\/view-test\.md$/.test(DOC),
    DOC
  );
  check(
    "CLI prints local-only URL",
    !!urlMatch && plain.includes(`127.0.0.1:${PORT}/#`),
    (out.match(/Open\s+\S+/) || [""])[0].trim()
  );

  // --- static serving, no CDN needed ---
  const idx = await get("/");
  check(
    "serves index.html",
    idx.status === 200 && idx.body.includes("<title>livedown</title>")
  );
  // Fonts and mermaid are deliberately left on CDN; nothing else may be.
  const head = idx.body.slice(0, idx.body.indexOf("<style>"));
  const cdnRefs = (head.match(/https:\/\/[^"']+/g) || [])
    .filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u))
    .filter((u) => !/mermaid/.test(u));
  check(
    "only fonts + mermaid remain on CDN",
    cdnRefs.length === 0,
    cdnRefs.join(" ")
  );
  check(
    "marked/codemirror/nacl served locally",
    [
      "/vendor/marked.min.js",
      "/vendor/nacl-fast.min.js",
      "/vendor/codemirror/codemirror.min.css",
      "/vendor/codemirror/codemirror.min.js",
      "/vendor/codemirror/markdown.min.js",
    ].every((v) => head.includes(v))
  );
  const marked = await get("/vendor/marked.min.js");
  check(
    "serves vendored marked",
    marked.status === 200 && marked.body.length > 30000,
    `${marked.body.length}b ${marked.type}`
  );
  const cmcss = await get("/vendor/codemirror/codemirror.min.css");
  check(
    "serves vendored codemirror css",
    cmcss.status === 200 && cmcss.type.startsWith("text/css")
  );
  const esc = await get("/vendor/../../package.json");
  check(
    "blocks path traversal",
    esc.status === 403 || esc.status === 404,
    `status ${esc.status}`
  );

  // --- websocket: a browser joining the room ---
  const ws = new WebSocket(WS_URL);
  const msgs = [];
  ws.on("message", (d) => msgs.push(JSON.parse(d.toString())));
  await new Promise((r, j) => {
    ws.on("open", r);
    ws.on("error", j);
  });
  await sleep(400);

  const init = msgs.find((m) => m.type === "init");
  check("sends init", !!init);
  check(
    "init content is the file from disk",
    init && init.content.includes("From disk.")
  );
  check(
    "init reports protected:false (editable, no key)",
    init && init.protected === false
  );
  check("init reports hasSharer:true", init && init.hasSharer === true);
  check("init reports private:false", init && init.private === false);

  // --- live reload: disk -> browser ---
  msgs.length = 0;
  fs.writeFileSync(FILE, "# Original\n\nEdited on disk.\n");
  await sleep(1200);
  const upd = msgs.find((m) => m.type === "update");
  check(
    "disk edit reaches the browser",
    !!upd && upd.content.includes("Edited on disk.")
  );

  // --- writeback: browser -> disk, unsigned ---
  ws.send(
    JSON.stringify({
      type: "push",
      content: "# From browser\n\nTyped in the editor.\n",
      signature: null,
      meta: {
        editor: "guest-1",
        editedAt: new Date().toISOString(),
        file: "view-test.md",
      },
    })
  );
  await sleep(1200);
  const onDisk = fs.readFileSync(FILE, "utf8");
  check(
    "unsigned browser push is written to disk",
    onDisk.includes("Typed in the editor."),
    JSON.stringify(onDisk.slice(0, 40))
  );

  // --- a malicious page in the user's browser must not reach the room ---
  // WebSockets ignore the same-origin policy, so loopback binding alone does
  // not stop a visited site from reading the doc and overwriting the file.
  const evil = new WebSocket(WS_URL, { origin: "http://evil.example" });
  const evilRejected = await new Promise((r) => {
    evil.on("open", () => r(false));
    evil.on("error", () => r(true));
  });
  check("rejects websocket from a foreign origin", evilRejected);

  // Host checks block DNS rebinding, where a name resolving to 127.0.0.1
  // would otherwise satisfy the origin check.
  const rebound = await new Promise((r) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: PORT,
        path: "/",
        headers: { Host: "evil.example" },
      },
      (res) => r(res.statusCode)
    );
    req.on("error", () => r(0));
    req.end();
  });
  check(
    "rejects http request with a foreign Host header",
    rebound === 403,
    `status ${rebound}`
  );

  // A local process, or a tab left over from an earlier run, must not reach
  // the room by guessing its name.
  const guessed = new WebSocket(
    `ws://127.0.0.1:${PORT}/parties/main/view-test.md`
  );
  const guessRejected = await new Promise((r) => {
    guessed.on("open", () => r(false));
    guessed.on("error", () => r(true));
  });
  check(
    "rejects a connection that does not know the room token",
    guessRejected
  );

  check(
    "serves a content security policy",
    /default-src 'none'/.test(idx.csp || ""),
    (idx.csp || "none").slice(0, 32)
  );
  check("serves nosniff", idx.nosniff === "nosniff");

  // --- malformed input must not kill the CLI ---
  ws.send("null");
  ws.send("123");
  ws.send("not json at all");
  await sleep(600);
  check(
    "survives malformed websocket messages",
    cli.exitCode === null,
    `exit ${cli.exitCode}`
  );

  // --- frontmatter from the wire must not inject YAML keys ---
  ws.send(
    JSON.stringify({
      type: "push",
      content: "# Body\n",
      meta: {
        owner: 'x"\nmalicious_key: injected\nowner2: "y',
        title: "t",
        editor: "guest-1",
      },
    })
  );
  await sleep(1200);
  const fm = fs.readFileSync(FILE, "utf8");
  const keys = Object.keys(matter(fm).data);
  check(
    "frontmatter injection is escaped, not expanded",
    !keys.includes("malicious_key") && keys.includes("owner"),
    keys.join(",")
  );

  // --- no echo loop ---
  msgs.length = 0;
  await sleep(1000);
  check(
    "no echo loop after writeback",
    msgs.filter((m) => m.type === "update").length === 0,
    `${msgs.length} msgs`
  );

  ws.close();
  cli.kill("SIGKILL");
  await sleep(300);
  fs.rmSync(TMP, { recursive: true, force: true });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})();
