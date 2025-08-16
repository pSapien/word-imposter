import { RoomService, SessionService, WebSocketManager, AuthMiddleware } from "./core";

import { AuthHandlers } from "./api/handlers/AuthHandlers.js";
import { RoomHandlers } from "./api/handlers/RoomHandlers.js";
import { GameHandlers } from "./api/handlers/GameHandlers.js";
import { MessageRouter } from "./api/routes/MessageRouter.js";
import { ServerResponseEvents } from "@imposter/shared";

const services = {
  session: new SessionService(),
  room: new RoomService(),
};

const wsManager = new WebSocketManager<ServerResponseEvents>();

const middlewares = {
  auth: new AuthMiddleware(wsManager, services),
};

const routeHandlers = {
  auth: new AuthHandlers(wsManager, services),
  room: new RoomHandlers(wsManager, services),
  game: new GameHandlers(wsManager, services),
};

const messageRouter = new MessageRouter(middlewares, routeHandlers);

// Cleanup intervals
setInterval(() => {
  // sessionService.cleanupInactiveSessions();
  services.room.cleanupEmptyRooms();
  wsManager.cleanupStaleConnections();
}, 60000); // Every minute

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) return undefined;
    return new Response("Word Imposter Game Server");
  },

  websocket: {
    open(ws) {
      const connectionId = wsManager.addConnection(ws);
      console.log(`Connection opened: ${connectionId}`);
    },

    ping(ws, data) {
      ws.pong(data);
    },

    async message(ws, data) {
      console.log(wsManager.getActiveConnectionIds());
      const connectionId = wsManager.getConnectionId(ws);

      if (!connectionId) {
        console.error("Connection not found for socket");
        return;
      }

      wsManager.updatePing(connectionId);

      let message;
      try {
        message = JSON.parse(data as string);
      } catch {
        wsManager.send(connectionId, {
          type: "error",
          payload: {
            code: "message.invalid_format",
            message: "Invalid message format",
          },
        });
        return;
      }

      console.log("RX:", JSON.stringify(message, null, 2));
      messageRouter.route(connectionId, message);
    },

    close(ws) {
      const connectionId = wsManager.getConnectionId(ws);
      if (connectionId) {
        // Handle player leaving room
        const connection = wsManager.getConnection(connectionId);

        // roomHandlers.handleLeaveRoom(connectionId);
        wsManager.removeConnection(connectionId);
        console.log(`Connection closed: ${connectionId}`);
      }
    },
  },
});

console.log(`🎮 Server running on ${server.hostname}:${server.port}`);
