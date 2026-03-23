import type * as Party from "partykit/server";

export default class LivedownRoom implements Party.Server {
  latestContent = "";
  latestMeta: Record<string, string> = {};
  guestCounter = 0;

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
      })
    );
  }

  onMessage(message: string, sender: Party.Connection) {
    try {
      const msg = JSON.parse(message);
      if (msg.type !== "push") return;

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
