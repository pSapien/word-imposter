import { RoomService, SessionService, WebSocketManager, AuthMiddleware } from "./core";
import { ServerResponseEvents } from "@imposter/shared";

import { AuthHandlers } from "./api/handlers/AuthHandlers.js";
import { RoomHandlers } from "./api/handlers/RoomHandlers.js";
import { MessageRouter } from "./api/routes/MessageRouter.js";

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
};

const messageRouter = new MessageRouter(middlewares, routeHandlers);

const cleanupInterval = setInterval(() => {
  // services.session.cleanupInactiveSessions();
  services.room.cleanupEmptyRooms();
  wsManager.cleanupStaleConnections();
}, 60000);

const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) return undefined;
    return new Response("Word Imposter Game Server");
  },

  websocket: {
    open(ws) {
      const connectionId = wsManager.addConnection(ws);
      console.log(`Connection opened: ${connectionId}:${ws.remoteAddress}`);
    },

    ping(ws, data) {
      ws.pong(data);
    },

    async message(ws, data) {
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

// ---------------- Graceful Shutdown ----------------

async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);

  server.stop(true);
  clearInterval(cleanupInterval);

  wsManager.getAllConnections().forEach((conn) => {
    try {
      conn.socket.close(1001, "Server shutting down");
      wsManager.removeConnection(conn.id);
    } catch (err) {
      console.error("Error closing connection:", err);
    }
  });

  services.session.shutdown();
  services.room.shutdown();

  console.log("Cleanup complete. Exiting.");
  process.exit(0);
}

["SIGINT", "SIGTERM"].forEach((sig) => {
  process.on(sig, () => gracefulShutdown(sig));
});
