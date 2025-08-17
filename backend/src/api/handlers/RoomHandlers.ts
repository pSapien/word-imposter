import { AuthenticatedRequest, RoomJoinedResponse, ServerResponseEvents, StartGameRequest } from "@imposter/shared";
import { RoomService, WebSocketManager, SessionService, Room } from "../../core";
import { WordImposterGameEngine } from "../../games/imposter/WordImposterGame.js";

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

type Services = {
  session: SessionService;
  room: RoomService;
};

export class RoomHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  handleCreateRoom = (req: AuthenticatedRequest, payload: CreateRoomRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      const room = this.services.room.create(session.profile, payload.roomName);

      this.wsManager.send(req.connectionId, {
        type: "room_created",
        payload: {
          roomCode: room.roomCode,
          roomName: room.name,
          hostId: room.hostId,
          members: room.members.map((r) => {
            return {
              displayName: r.displayName,
              id: r.profileId,
              role: r.role,
            };
          }),
        },
      });
    } catch (error) {
      console.error("Error:", error);
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
      const session = this.services.session.getSession(req.sessionId);
      const room = this.services.room.join(payload.roomCode, session.profile, payload.role || "player");
      this.broadcastRoomJoined(room);
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
      const session = this.services.session.getSession(req.sessionId);
      const room = this.services.room.leave(session.profile.id);
      if (room) this.broadcastRoomJoined(room);
    } catch (error) {
      console.error("Error handling leave room:", error);
    }
  };

  handleStartGame = (req: AuthenticatedRequest, payload: StartGameRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.connectionId);
      const room = this.services.room.getRoomByMember(session.profile.id);

      if (room.hostId && room.hostId !== session.profile.id) throw new Error("Only host can start games");

      let game: WordImposterGameEngine;
      switch (payload.gameType) {
        case "imposter":
          game = new WordImposterGameEngine({
            minPlayers: 3,
            maxPlayers: 20,
            allowSpectators: true,
            settings: payload.settings,
          });
          break;
        default:
          throw new Error("Unknown game type");
      }

      room.members
        .filter((m) => m.role === "player")
        .forEach((member) => {
          game.joinPlayer({
            profileId: member.profileId,
            displayName: member.displayName,
            role: "player",
          });
        });

      room.members
        .filter((m) => m.role === "spectator")
        .forEach((member) => {
          game.joinPlayer({
            profileId: member.profileId,
            displayName: member.displayName,
            role: "spectator",
          });
        });

      const result = game.start();
      if (!result.success) throw new Error(result.error || "Failed to start game");

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

  private broadcastRoomJoined(room: Room) {
    const event: RoomJoinedResponse = {
      type: "room_joined",
      payload: {
        roomCode: room.roomCode,
        roomName: room.name,
        hostId: room.hostId,
        members: room.members.map((r) => {
          return {
            displayName: r.displayName,
            id: r.profileId,
            role: r.role,
          };
        }),
      },
    } as const;
    room.members
      .map((member) => this.services.session.getSessionByProfileId(member.profileId))
      .map((session) => session.connectionId)
      .forEach((connectionId) => this.wsManager.send(connectionId, event));
  }

  private broadcastGameUpdate(roomId: string, game: any) {
    // Implementation to broadcast game state to all room members
    // This would send personalized game views to each player
  }
}
