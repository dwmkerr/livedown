import crypto from "crypto";
import fs from "fs";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { signContent } from "./token";

const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

// A document is a few hundred KB at most; ws defaults to 100MB, which lets a
// single message drive a write of that size to the user's file.
const MAX_PAYLOAD = 4 * 1024 * 1024;

// The page loads its own scripts, talks only to this server, and pulls fonts
// from Google. Markdown is rendered with innerHTML and may come from a file the
// user did not write, so this is what stops an injected <img onerror> from
// reaching the network.
const CSP = [
  "default-src 'none'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data:",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Browsers connect WebSockets to localhost from ANY page the user has open:
// WebSockets are not subject to the same-origin policy, and binding to loopback
// does nothing to stop it. Loopback is also only a machine boundary, not a user
// or process one - any local UID can reach 127.0.0.1. So three checks guard the
// room, and the unguessable room name below is what covers the third case.
function isLocalHostHeader(host: string | undefined, port: number): boolean {
  if (!host) return false;
  return host === `127.0.0.1:${port}` || host === `localhost:${port}`;
}

function isAllowedOrigin(origin: string | undefined, port: number): boolean {
  // Absent means a non-browser client. That is not authentication, so such a
  // connection still has to know the room token like everyone else.
  if (origin === undefined) return true;
  return (
    origin === `http://127.0.0.1:${port}` ||
    origin === `http://localhost:${port}`
  );
}

export interface LocalServer {
  port: number;
  /** Unguessable room name, `<token>/<basename>`. Belongs in the viewer URL. */
  doc: string;
  close: () => Promise<void>;
}

// A single-document room, serving the same public/index.html the relay serves.
//
// Deliberately omits what the relay needs for untrusted parties: edit-key
// registration and private-mode view gating. It reports `protected: false` so
// the browser allows editing with no key. Browser pushes therefore arrive
// unsigned - but this server signs them before relaying, so the watcher's
// signature check stays unconditional and defense in depth is preserved.
class Room {
  latestContent = "";
  latestMeta: Record<string, unknown> = {};
  guestCounter = 0;
  sharers = new Set<WebSocket>();
  clients = new Set<WebSocket>();

  constructor(private readonly editKey: string) {}

  broadcast(payload: string, exclude?: WebSocket): void {
    for (const c of this.clients) {
      if (c === exclude || c.readyState !== WebSocket.OPEN) continue;
      c.send(payload);
    }
  }

  init(guestId: number): string {
    return JSON.stringify({
      type: "init",
      content: this.latestContent,
      meta: this.latestMeta,
      guestId,
      hasSharer: this.sharers.size > 0,
      protected: false,
      publicKey: null,
      private: false,
    });
  }

  onConnect(ws: WebSocket): void {
    this.clients.add(ws);
    this.guestCounter++;
    ws.send(this.init(this.guestCounter));
  }

  onMessage(ws: WebSocket, data: string): void {
    let msg: Record<string, unknown>;
    try {
      const parsed = JSON.parse(data);
      // JSON.parse("null") and JSON.parse("1") both parse cleanly but have no
      // properties, so the type read below would throw and kill the CLI.
      if (typeof parsed !== "object" || parsed === null) return;
      msg = parsed;
    } catch {
      return;
    }

    // The watcher registers with set-token and waits for the ack before the CLI
    // prints a URL. Its public key is ignored: honouring it would flip the room
    // to protected and prompt the browser for an edit key.
    if (msg.type === "set-token") {
      const wasEmpty = this.sharers.size === 0;
      this.sharers.add(ws);
      ws.send(JSON.stringify({ type: "sharer-ack" }));
      if (wasEmpty) {
        this.broadcast(
          JSON.stringify({
            type: "sharer-here",
            protected: false,
            publicKey: null,
            private: false,
          }),
          ws
        );
      }
      return;
    }

    if (msg.type !== "push") return;

    this.latestContent = typeof msg.content === "string" ? msg.content : "";
    this.latestMeta = (msg.meta as Record<string, unknown>) || {};
    this.broadcast(
      JSON.stringify({
        type: "update",
        content: this.latestContent,
        meta: this.latestMeta,
        signature: signContent(this.latestContent, this.editKey),
      }),
      ws
    );
  }

  onClose(ws: WebSocket): void {
    this.clients.delete(ws);
    if (this.sharers.delete(ws) && this.sharers.size === 0) {
      this.broadcast(JSON.stringify({ type: "sharer-gone" }));
    }
  }
}

function serveStatic(
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const urlPath = (req.url || "/").split("?")[0];
  // Any path without a file extension is the viewer itself: the single-page app
  // routes on the URL hash, not the path.
  const rel = path.extname(urlPath) ? urlPath : "/index.html";

  // The leading slash is load-bearing: it makes path.normalize clamp ".." at
  // the root before path.join, which is what contains traversal. The check
  // below is the backstop if that invariant is ever broken.
  const file = path.join(
    PUBLIC_DIR,
    path.normalize("/" + rel.replace(/^\/+/, ""))
  );
  if (!file.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
      "Content-Security-Policy": CSP,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    });
    res.end(body);
  });
}

export function startLocalServer(
  port: number,
  basename: string,
  editKey: string
): Promise<LocalServer> {
  // An unguessable room name. Loopback does not keep out other local processes,
  // and a fixed name on a fixed port would also let a tab left open from an
  // earlier run silently attach to whatever document is served next.
  const doc = `${crypto.randomBytes(8).toString("hex")}/${basename}`;
  const wsPath = `/parties/main/${encodeURIComponent(doc)}`;

  const room = new Room(editKey);
  const server = http.createServer((req, res) => {
    const port = (server.address() as { port: number }).port;
    if (!isLocalHostHeader(req.headers.host, port)) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405).end("Method not allowed");
      return;
    }
    serveStatic(req, res);
  });
  const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  wss.on("connection", (ws: WebSocket) => {
    room.onConnect(ws);
    ws.on("message", (data) => room.onMessage(ws, data.toString()));
    ws.on("close", () => room.onClose(ws));
    ws.on("error", () => room.onClose(ws));
  });

  server.on("upgrade", (req, socket, head) => {
    const port = (server.address() as { port: number }).port;
    if (
      (req.url || "").split("?")[0] !== wsPath ||
      !isLocalHostHeader(req.headers.host, port) ||
      !isAllowedOrigin(req.headers.origin, port)
    ) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws));
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    // Loopback only, so the room is never reachable from the network.
    server.listen(port, "127.0.0.1", () => {
      server.on("error", () => {
        /* post-listen errors must not take down the CLI */
      });
      const addr = server.address();
      resolve({
        port: typeof addr === "object" && addr ? addr.port : port,
        doc,
        close: () =>
          new Promise((done) => {
            // server.close() only stops new connections and waits for open ones
            // to drain, so an attached browser would hang shutdown.
            for (const client of wss.clients) client.terminate();
            wss.close();
            server.close(() => done());
          }),
      });
    });
  });
}
