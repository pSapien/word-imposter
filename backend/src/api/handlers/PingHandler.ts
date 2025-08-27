import type { SessionProfile, WebSocketManager } from "@server/core";
import { type ServerResponseEvents } from "@imposter/shared";

export class PingHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>) {}

  handlePing(connectionId: string, session: SessionProfile) {
    this.wsManager.send(connectionId, {
      type: "pong",
      payload: {},
    });
  }
}
