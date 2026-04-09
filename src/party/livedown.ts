import type * as Party from "partykit/server";

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
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

export default class LivedownRoom implements Party.Server {
  latestContent = "";
  latestMeta: Record<string, string> = {};
  guestCounter = 0;
  publicKey: string | undefined = undefined;
  // Connection IDs that have registered as sharers via set-token.
  // hasSharer = sharers.size > 0. Authoritative signal to viewers.
  sharers = new Set<string>();

  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection) {
    this.guestCounter++;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (conn as any).guestId = this.guestCounter;

    conn.send(
      JSON.stringify({
        type: "init",
        content: this.latestContent,
        meta: this.latestMeta,
        guestId: this.guestCounter,
        hasSharer: this.sharers.size > 0,
        protected: !!this.publicKey,
        publicKey: this.publicKey || null,
      })
    );
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
            }),
            [sender.id]
          );
        }
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

      this.room.broadcast(
        JSON.stringify({
          type: "update",
          content: msg.content,
          meta: msg.meta || {},
          signature: msg.signature || null,
        }),
        [sender.id]
      );
    } catch {
      /* ignore malformed */
    }
  }
}
