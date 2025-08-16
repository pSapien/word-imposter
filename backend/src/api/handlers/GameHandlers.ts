import { ServerResponseEvents } from "@imposter/shared";
import { WebSocketManager, RoomService, BaseGame, SessionService } from "../../core";

export interface GameActionRequest {
  type: "game_action";
  payload: {
    actionType: string;
    data?: any;
  };
}

type Services = {
  session: SessionService;
  room: RoomService;
};

export class GameHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  handleGameAction = (connectionId: string, payload: GameActionRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(connectionId);
      const room = this.services.room.getRoomByMember(session.profile.id);
      if (!room?.currentGame) {
        throw new Error("No active game found");
      }

      const result = room.currentGame.processAction({
        type: payload.actionType,
        playerId: session.profile.id,
        data: payload.data,
      });

      if (!result.success) {
        throw new Error(result.error || "Action failed");
      }

      // Broadcast game events to all room members
      if (result.events) {
        this.broadcastGameEvents(room.roomId, room.currentGame, result.events);
      }

      // Send success response
      this.wsManager.send(connectionId, {
        type: "game_action_success",
        payload: {
          actionType: payload.actionType,
        },
      });
    } catch (error) {
      this.wsManager.send(connectionId, {
        type: "error",
        payload: {
          code: "game.action_failed",
          message: error instanceof Error ? error.message : "Game action failed",
        },
      });
    }
  };

  handleGetGameState = (connectionId: string) => {
    try {
      const connection = this.wsManager.getConnection(connectionId);
      if (!connection?.session) {
        throw new Error("Authentication required");
      }

      const room = this.roomService.getRoomByMember(connection.session.profile.id);
      if (!room?.currentGame) {
        this.wsManager.send(connectionId, {
          type: "game_state",
          payload: null,
        });
        return;
      }

      const playerView = room.currentGame.getPlayerView(connection.session.profile.id);

      this.wsManager.send(connectionId, {
        type: "game_state",
        payload: playerView,
      });
    } catch (error) {
      this.wsManager.send(connectionId, {
        type: "error",
        payload: {
          code: "game.state_failed",
          message: error instanceof Error ? error.message : "Failed to get game state",
        },
      });
    }
  };

  private broadcastGameEvents(roomId: string, game: BaseGame, events: any[]) {
    // Get room and all member connections
    const room =
      this.roomService.getRoomByCode(roomId) ||
      Array.from(this.roomService["rooms"].values()).find((r) => r.roomId === roomId);

    if (!room) return;

    events.forEach((event) => {
      const targetMembers = event.targetPlayers || room.members.map((m) => m.profileId);

      targetMembers.forEach((profileId: string) => {
        const session = this.authService.getSession(profileId);
        if (session?.socketId) {
          const connection = this.wsManager.getConnection(session.socketId);
          if (connection) {
            // Send personalized game view with the event
            const playerView = game.getPlayerView(profileId);
            this.wsManager.send(connection.id, {
              type: "game_event",
              payload: {
                event,
                gameState: playerView,
              },
            });
          }
        }
      });
    });
  }
}
