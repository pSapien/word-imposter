import { eventHandlers } from "./server.events.ts";
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
      console.log("RX:", type, payload);
      if (typeof handler === "function") {
        handler(ws, payload);
      } else {
        console.warn(`No handler found for event type: ${type}`);
        ws.send(JSON.stringify({ type: "error", payload: { message: `Unknown event type: ${type}` } }));
      }
    },
    close(ws) {
      console.log("Client disconnected");
    },
  },
});

console.log(`Listening on ${server.hostname}:${server.port}`);
