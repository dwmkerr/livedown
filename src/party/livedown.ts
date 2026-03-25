import type * as Party from "partykit/server";

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function verifySignature(
  content: string,
  signatureHex: string,
  publicKeyHex: string
): Promise<boolean> {
  try {
    const msg = new Uint8Array(new TextEncoder().encode(content));
    const sig = new Uint8Array(fromHex(signatureHex));
    const pub = new Uint8Array(fromHex(publicKeyHex));
    const key = await crypto.subtle.importKey(
      "raw",
      pub,
      { name: "Ed25519" } as EcKeyImportParams,
      false,
      ["verify"]
    );
    return await crypto.subtle.verify(
      { name: "Ed25519" } as EcdsaParams,
      key,
      sig,
      msg
    );
  } catch {
    return false;
  }
}

export default class LivedownRoom implements Party.Server {
  latestContent = "";
  latestMeta: Record<string, string> = {};
  guestCounter = 0;
  publicKey: string | undefined = undefined;

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
        protected: !!this.publicKey,
        publicKey: this.publicKey || null,
      })
    );
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);

      if (msg.type === "set-token" && !this.publicKey && msg.publicKey) {
        this.publicKey = msg.publicKey;
        this.room.broadcast(
          JSON.stringify({
            type: "protected",
            protected: true,
            publicKey: this.publicKey,
          })
        );
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
