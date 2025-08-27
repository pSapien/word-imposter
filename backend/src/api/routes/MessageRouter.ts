import { AuthHandlers, RoomHandlers, PingHandlers } from "../handlers";
import { AuthMiddleware } from "@server/core";
import type { ClientRequestEvents } from "@imposter/shared";

type ClientEvents = ClientRequestEvents["type"];

type Handlers = {
  auth: AuthHandlers;
  room: RoomHandlers;
  ping: PingHandlers;
};

type Middlewares = {
  auth: AuthMiddleware;
};

export class MessageRouter {
  private routes = new Map<ClientEvents, (connectionId: string, payload: any) => void>();

  constructor(private middlewares: Middlewares, private handlers: Handlers) {
    this.setupRoutes();
  }

  private setupRoutes() {
    this.routes.set("login", this.handlers.auth.handleLogin.bind(this.handlers.auth));
    this.routes.set("ping", this.handlers.ping.handlePing.bind(this.handlers.ping));

    this.routes.set(
      "create_room",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleCreateRoom(req, payload))
    );

    this.routes.set(
      "join_room",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleJoinRoom(req, payload))
    );

    this.routes.set(
      "kick_room_member",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleKickRoomMember(req, payload))
    );

    this.routes.set(
      "leave_room",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleLeaveRoom(req))
    );

    this.routes.set(
      "start_game",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleStartGame(req, payload))
    );

    this.routes.set(
      "get_game_state",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleGetGameState(req, payload))
    );

    this.routes.set(
      "game_action",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleGameAction(req, payload))
    );
  }

  route(connectionId: string, message: ClientRequestEvents): void {
    const handler = this.routes.get(message.type);

    if (!handler) {
      console.warn("Received Unknown message:", message.type);
      return;
    }

    try {
      handler(connectionId, message.payload);
    } catch (error) {
      console.error(`Error handling message type ${message.type}:`, error);
      // Send internal error response
    }
  }
}
