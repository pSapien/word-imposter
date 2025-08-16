import { AuthenticatedRequest, ServerResponseEvents } from "@imposter/shared";
import { RoomService, WebSocketManager, SessionService } from "../../core";
import { WordImposterGame } from "../../games/word-imposter/WordImposterGame.js";

export interface CreateRoomRequest {
  type: "create_room";
  payload: {
    roomName: string;
  };
}

export interface JoinRoomRequest {
  type: "join_room";
  payload: {
    roomCode: string;
    role?: "player" | "spectator";
  };
}

export interface StartGameRequest {
  type: "start_game";
  payload: {
    gameType: string;
    settings: any;
  };
}

type Services = {
  session: SessionService;
  room: RoomService;
};

export class RoomHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  handleCreateRoom = (req: AuthenticatedRequest, payload: CreateRoomRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.connectionId);
      const room = this.services.room.create(session.profile, payload.roomName);

      this.wsManager.send(req.connectionId, {
        type: "room_created",
        payload: {
          roomCode: room.roomCode,
          roomName: room.name,
          hostId: room.hostId,
        },
      });
    } catch (error) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: "room.create_failed",
          message: "Failed to create room",
        },
      });
    }
  };

  handleJoinRoom = (req: AuthenticatedRequest, payload: JoinRoomRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.connectionId);
      const room = this.services.room.join(payload.roomCode, session.profile, payload.role || "player");

      this.wsManager.send(req.connectionId, {
        type: "room_joined",
        payload: {
          roomCode: room.roomCode,
          roomName: room.name,
          hostId: room.hostId,
        },
      });

      this.broadcastRoomUpdate(room.roomId);
    } catch (error) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: "room.join_failed",
          message: error instanceof Error ? error.message : "Failed to join room",
        },
      });
    }
  };

  handleLeaveRoom = (req: AuthenticatedRequest) => {
    try {
      const session = this.services.session.getSession(req.connectionId);
      const room = this.services.room.leave(session.profile.id);
      if (room) {
        this.broadcastRoomUpdate(room.roomId);
      }

      this.wsManager.send(req.connectionId, {
        type: "room_left",
        payload: {},
      });
    } catch (error) {
      console.error("Error handling leave room:", error);
    }
  };

  handleStartGame = (req: AuthenticatedRequest, payload: StartGameRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.connectionId);
      const room = this.services.room.getRoomByMember(session.profile.id);

      if (room.hostId !== session.profile.id) throw new Error("Only host can start games");

      // Create game based on type
      let game;
      switch (payload.gameType) {
        case "word-imposter":
          game = new WordImposterGame({
            minPlayers: 3,
            maxPlayers: 20,
            allowSpectators: true,
            settings: payload.settings,
          });
          break;
        default:
          throw new Error("Unknown game type");
      }

      // Add players to game
      room.members
        .filter((m) => m.role === "player")
        .forEach((member) => {
          game.addPlayer({
            profileId: member.profileId,
            displayName: member.displayName,
            role: "player",
          });
        });

      // Add spectators
      room.members
        .filter((m) => m.role === "spectator")
        .forEach((member) => {
          game.addPlayer({
            profileId: member.profileId,
            displayName: member.displayName,
            role: "spectator",
          });
        });

      const result = game.start();
      if (!result.success) {
        throw new Error(result.error || "Failed to start game");
      }

      this.services.room.setGame(room.roomId, game);
      this.broadcastGameUpdate(room.roomId, game);
    } catch (error) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: "game.start_failed",
          message: error instanceof Error ? error.message : "Failed to start game",
        },
      });
    }
  };

  private broadcastRoomUpdate(roomId: string) {
    // Implementation to broadcast room state to all members
    // This would get all room members and send them the updated room state
  }

  private broadcastGameUpdate(roomId: string, game: any) {
    // Implementation to broadcast game state to all room members
    // This would send personalized game views to each player
  }
}
