import { AuthHandlers, RoomHandlers, GameHandlers } from "../handlers";
import { AuthMiddleware } from "../../core";
import type { ClientRequestEvents } from "@imposter/shared";

type ClientEvents = ClientRequestEvents["type"];

type Handlers = {
  auth: AuthHandlers;
  room: RoomHandlers;
  game: GameHandlers;
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
    this.routes.set("login", this.handlers.auth.handleLogin);
    this.routes.set("sync_login", this.handlers.auth.handleSyncLogin);
    this.routes.set("ping", this.handlePing);

    this.routes.set(
      "create_room",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleCreateRoom(req, payload))
    );

    this.routes.set(
      "join_room",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleJoinRoom(req, payload))
    );

    this.routes.set(
      "leave_room",
      this.middlewares.auth.requireAuth((req, payload) => this.handlers.room.handleLeaveRoom(req))
    );

    // this.routes.set(
    //   "start_game",
    //   this.authMiddleware.requireHost((req, payload) => this.roomHandlers.handleStartGame(req.connectionId, payload))
    // );

    // this.routes.set(
    //   "game_action",
    //   this.authMiddleware.requireAuth((req, payload) => this.gameHandlers.handleGameAction(req.connectionId, payload))
    // );

    // this.routes.set(
    //   "get_game_state",
    //   this.authMiddleware.requireAuth((req, payload) => this.gameHandlers.handleGetGameState(req.connectionId))
    // );
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

  private handlePing = (connectionId: string, payload: any) => {
    // Update connection ping time and respond
  };
}
