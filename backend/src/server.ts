import { eventHandlers, handlePlayerDisconnect } from "./server.events";
import type { ClientRequestEvents } from "@imposter/shared";

const server = Bun.serve({
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) return undefined;
    return new Response("Hello world!");
  },
  websocket: {
    open(ws) {
      console.log("Connection opened");
    },
    ping(ws, data) {
      ws.pong(data);
    },

    async message(ws, data) {
      let message: ClientRequestEvents;
      try {
        message = JSON.parse(data as string) as ClientRequestEvents;
      } catch {
        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid message format" } }));
        return;
      }

      const { type, payload } = message;
      const handler = eventHandlers[type];
      if (typeof handler === "function") {
        // @ts-ignore
        handler(ws, payload);
      } else {
        console.warn(`No handler found for event type: ${type}`);
        ws.send(JSON.stringify({ type: "error", payload: { message: `Unknown event type: ${type}` } }));
      }
    },
    close(ws) {
      console.log("Player disconnected");
      // @ts-ignore
      // handlePlayerDisconnect(ws as Bun.WebSocket);
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
