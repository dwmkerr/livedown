import type * as Party from "partykit/server";

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifySignature(
  content: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const { ed25519 } = await import("@noble/curves/ed25519.js");
    const msg = new TextEncoder().encode(content);
    const sig = fromHex(signatureHex);
    const pub = fromHex(publicKeyHex);
    return ed25519.verify(sig, msg, pub);
  } catch {
    return false;
  }
}

// True if `key` is the room's edit key — i.e. its 32-byte seed derives the
// stored public key. Lets an edit-key holder view a private room without also
// holding the separate view key (edit key is a superset of the view key).
async function isEditKey(
  keyHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const seed = fromHex(keyHex);
    if (seed.length !== 32) return false;
    const { ed25519 } = await import("@noble/curves/ed25519.js");
    return toHex(ed25519.getPublicKey(seed)) === publicKeyHex;
  } catch {
    return false;
  }
}

export default class LivedownRoom implements Party.Server {
  latestContent = "";
  latestMeta: Record<string, string> = {};
  guestCounter = 0;
  publicKey: string | undefined = undefined;
  // Connection IDs that have registered as sharers via set-token.
  // hasSharer = sharers.size > 0. Authoritative signal to viewers.
  sharers = new Set<string>();
  // Private mode: content is withheld until a connection authenticates with the
  // view key (or edit key). isPrivate is latched on by the first set-token that
  // carries a viewKey.
  isPrivate = false;
  viewKey: string | undefined = undefined;

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    this.guestCounter++;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conn as any).guestId = this.guestCounter;

    conn.send(JSON.stringify(this.initFor(conn)));
  }

  // Build the init payload for a connection. In private mode, unauthenticated
  // connections get no content and no public key — a leaked URL reveals nothing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initFor(conn: Party.Connection): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authed = !this.isPrivate || (conn as any).viewAuthenticated === true;
    return {
      type: "init",
      content: authed ? this.latestContent : null,
      meta: authed ? this.latestMeta : {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      guestId: (conn as any).guestId,
      hasSharer: this.sharers.size > 0,
      protected: !!this.publicKey,
      publicKey: authed ? this.publicKey || null : null,
      private: this.isPrivate,
    };
  }

  onClose(conn: Party.Connection) {
    if (this.sharers.delete(conn.id) && this.sharers.size === 0) {
      // Last sharer disconnected — notify all remaining viewers
      this.room.broadcast(JSON.stringify({ type: "sharer-gone" }));
    }
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);

      if (msg.type === "set-token" && msg.publicKey) {
        // First sharer registers the public key. Subsequent set-token
        // messages with a matching key are accepted (reconnect / multi-sharer);
        // mismatched keys are rejected.
        if (!this.publicKey) {
          this.publicKey = msg.publicKey;
        } else if (this.publicKey !== msg.publicKey) {
          return;
        }
        // A viewKey in set-token latches the room into private mode. The sharer
        // knows the key, so auto-authenticate its connection (no view-auth round
        // trip needed for the sharer's own browser opened via `o`).
        if (msg.viewKey) {
          this.isPrivate = true;
          this.viewKey = msg.viewKey;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sender as any).viewAuthenticated = true;
        const wasEmpty = this.sharers.size === 0;
        this.sharers.add(sender.id);
        // Acknowledge to the sender so the CLI can proceed to print the URL.
        sender.send(JSON.stringify({ type: "sharer-ack" }));
        if (wasEmpty) {
          this.room.broadcast(
            JSON.stringify({
              type: "sharer-here",
              protected: true,
              publicKey: this.publicKey,
              private: this.isPrivate,
            }),
            [sender.id]
          );
        }
        return;
      }

      if (msg.type === "view-auth") {
        // Only meaningful in private rooms; ignored otherwise.
        if (!this.isPrivate) return;
        const key = typeof msg.key === "string" ? msg.key : "";
        const ok =
          key === this.viewKey ||
          (!!this.publicKey && (await isEditKey(key, this.publicKey)));
        if (!ok) {
          sender.send(JSON.stringify({ type: "view-auth-error" }));
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sender as any).viewAuthenticated = true;
        sender.send(JSON.stringify({ type: "view-auth-ack" }));
        // Re-send init, now with full content + public key.
        sender.send(JSON.stringify(this.initFor(sender)));
        return;
      }

      if (msg.type !== "push") return;

      if (this.publicKey) {
        const valid =
          msg.signature &&
          (await verifySignature(
            msg.content || "",
            msg.signature,
            this.publicKey
          ));
        if (!valid) {
          sender.send(JSON.stringify({ type: "auth-error" }));
          const editor = msg.meta?.editor || "unknown";
          this.room.broadcast(
            JSON.stringify({ type: "auth-rejected", editor }),
            [sender.id]
          );
          return;
        }
      }

      this.latestContent = msg.content;
      this.latestMeta = msg.meta || {};

      const update = JSON.stringify({
        type: "update",
        content: msg.content,
        meta: msg.meta || {},
        signature: msg.signature || null,
      });
      if (this.isPrivate) {
        // Withhold content from connections that have not authenticated.
        for (const conn of this.room.getConnections()) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (conn.id === sender.id || (conn as any).viewAuthenticated !== true)
            continue;
          conn.send(update);
        }
      } else {
        this.room.broadcast(update, [sender.id]);
      }
    } catch {
      /* ignore malformed */
    }
  }
}
