import { RoomService, SessionService, WebSocketManager, AuthMiddleware, AuthService } from "./core/index.js";
import { ErrorCodes, type ServerResponseEvents } from "@imposter/shared";

import { AuthHandlers } from "./api/handlers/AuthHandlers.js";
import { RoomHandlers } from "./api/handlers/RoomHandlers.js";
import { MessageRouter } from "./api/routes/MessageRouter.js";
import { PingHandlers } from "./api/handlers/PingHandler.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key";

const services = {
  auth: new AuthService(JWT_SECRET, "1h"),
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
  ping: new PingHandlers(wsManager),
};

const messageRouter = new MessageRouter(middlewares, routeHandlers);

const ONE_MINUTE = 60 * 1000;

const CLEANUP_INACTIVE_SESSIONS = 30 * ONE_MINUTE;
const CLEANUP_STALE_ROOMS = 20 * ONE_MINUTE;
const CLEANUP_STALE_CONNECTIONS = 2 * ONE_MINUTE;

const cleanupInterval = setInterval(() => {
  services.session.cleanupInactiveSessions(CLEANUP_INACTIVE_SESSIONS);
  services.room.cleanupStaleRooms(CLEANUP_STALE_ROOMS);
  wsManager.cleanupStaleConnections(CLEANUP_STALE_CONNECTIONS);
}, 60000);

const server = Bun.serve({
  port: 3000,
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) return undefined;

    const url = new URL(req.url);
    if (url.pathname === "/i") {
      return new Response(
        JSON.stringify({
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: Math.floor(process.uptime()),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (url.pathname === "/stats") {
      return new Response(
        JSON.stringify({
          activeConnections: wsManager.getStats(),
          room: services.room.getStats(),
          sessions: services.session.getStats(),
          uptime: Math.floor(process.uptime()),
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response("Word Imposter Game Server");
  },

  websocket: {
    maxPayloadLength: 1024 * 1024,
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
      services.session.updateLastActive(connectionId);

      let message;
      try {
        message = JSON.parse(data as string);
      } catch {
        wsManager.send(connectionId, {
          type: "error",
          payload: {
            code: ErrorCodes.serverInvalidMessage,
            message: "Invalid message format",
          },
        });
        return;
      }

      messageRouter.route(connectionId, message);
    },

    close(ws) {
      const connectionId = wsManager.getConnectionId(ws);
      if (connectionId) {
        const connection = wsManager.getConnection(connectionId);
        const session = services.session.getSessionByConnectionId(connectionId);

        if (connection) {
          wsManager.removeConnection(connectionId);
          console.log(`Connection closed: ${connectionId}:${session?.profile?.displayName}`);
        }
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
