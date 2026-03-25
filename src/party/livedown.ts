import type * as Party from "partykit/server";

export function validatePush(
  roomToken: string | undefined,
  msgToken: string | undefined
): boolean {
  if (!roomToken) return true;
  return !!msgToken && roomToken === msgToken;
}

export default class LivedownRoom implements Party.Server {
  latestContent = "";
  latestMeta: Record<string, string> = {};
  guestCounter = 0;
  editToken: string | undefined = undefined;

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
        protected: !!this.editToken,
      })
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);

      if (msg.type === "set-token" && !this.editToken && msg.editToken) {
        this.editToken = msg.editToken;
        this.room.broadcast(
          JSON.stringify({ type: "protected", protected: true })
        );
        return;
      }

      if (msg.type !== "push") return;

      if (!validatePush(this.editToken, msg.editToken)) {
        sender.send(JSON.stringify({ type: "auth-error" }));
        const editor = msg.meta?.editor || "unknown";
        this.room.broadcast(JSON.stringify({ type: "auth-rejected", editor }), [
          sender.id,
        ]);
        return;
      }

      this.latestContent = msg.content;
      this.latestMeta = msg.meta || {};

      this.room.broadcast(
        JSON.stringify({
          type: "update",
          content: msg.content,
          meta: msg.meta || {},
        }),
        [sender.id]
      );
    } catch {
      /* ignore malformed */
    }
  }
}
