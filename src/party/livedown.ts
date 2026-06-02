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
      // Presence is itself sensitive in a private room — withhold it until the
      // connection authenticates. The browser shows the view modal off `private`
      // alone, so it never needs hasSharer while unauthenticated.
      hasSharer: authed ? this.sharers.size > 0 : false,
      protected: !!this.publicKey,
      publicKey: authed ? this.publicKey || null : null,
      private: this.isPrivate,
    };
  }

  // Broadcast that respects private-mode gating: in a private room, only
  // view-authenticated connections receive the payload (so presence, editor
  // identity, and content never reach an unauthenticated URL-only visitor).
  broadcastGated(payload: string, excludeId?: string) {
    if (!this.isPrivate) {
      this.room.broadcast(payload, excludeId ? [excludeId] : []);
      return;
    }
    for (const conn of this.room.getConnections()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (conn.id === excludeId || (conn as any).viewAuthenticated !== true)
        continue;
      conn.send(payload);
    }
  }

  onClose(conn: Party.Connection) {
    if (this.sharers.delete(conn.id) && this.sharers.size === 0) {
      // Last sharer disconnected — notify all remaining viewers
      this.broadcastGated(JSON.stringify({ type: "sharer-gone" }));
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
          // Latch private mode only at room creation. The public key is
          // broadcast freely, so honoring viewKey on later set-tokens would let
          // anyone who learns it flip an established room private with their own
          // key. The legitimate sharer always registers first (set-token gates
          // the join URL), so the first registration is authoritative.
          if (msg.viewKey) {
            this.isPrivate = true;
            this.viewKey = msg.viewKey;
          }
        } else if (this.publicKey !== msg.publicKey) {
          return;
        }
        // The sharer knows the view key, so auto-authenticate its connection on
        // every (re)registration — no view-auth round trip for the sharer.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sender as any).viewAuthenticated = true;
        const wasEmpty = this.sharers.size === 0;
        this.sharers.add(sender.id);
        // Acknowledge to the sender so the CLI can proceed to print the URL.
        sender.send(JSON.stringify({ type: "sharer-ack" }));
        if (wasEmpty) {
          // Gated: in a private room only authenticated viewers learn a sharer
          // arrived. Unauthenticated visitors stay at the view-key modal.
          this.broadcastGated(
            JSON.stringify({
              type: "sharer-here",
              protected: true,
              publicKey: this.publicKey,
              private: this.isPrivate,
            }),
            sender.id
          );
        }
        return;
      }

      if (msg.type === "view-auth") {
        // Only meaningful in private rooms; ignored otherwise.
        if (!this.isPrivate) return;
        // Cap failed attempts per connection. A 256-bit view key isn't
        // brute-forceable, but the cap stops a flood of attempts from
        // repeatedly triggering the Ed25519 derivation below (CPU amplification).
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const conn = sender as any;
        if ((conn.viewAuthFails || 0) >= 20) return;
        const key = typeof msg.key === "string" ? msg.key : "";
        // Only attempt the (costly) edit-key derivation on well-formed input.
        const isHex = /^[0-9a-f]{64}$/.test(key);
        const ok =
          key === this.viewKey ||
          (isHex && !!this.publicKey && (await isEditKey(key, this.publicKey)));
        if (!ok) {
          conn.viewAuthFails = (conn.viewAuthFails || 0) + 1;
          sender.send(JSON.stringify({ type: "view-auth-error" }));
          return;
        }
        conn.viewAuthFails = 0;
        conn.viewAuthenticated = true;
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
          // Gated: editor identity is sensitive in a private room.
          this.broadcastGated(
            JSON.stringify({ type: "auth-rejected", editor }),
            sender.id
          );
          return;
        }
      }

      this.latestContent = msg.content;
      this.latestMeta = msg.meta || {};

      // Gated: in a private room only authenticated connections get content.
      this.broadcastGated(
        JSON.stringify({
          type: "update",
          content: msg.content,
          meta: msg.meta || {},
          signature: msg.signature || null,
        }),
        sender.id
      );
    } catch {
      /* ignore malformed */
    }
  }
}
