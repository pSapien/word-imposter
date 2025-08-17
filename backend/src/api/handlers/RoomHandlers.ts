import {
  AuthenticatedRequest,
  GameActionRequest,
  GameStateRequest,
  RoomJoinedResponse,
  RoomMember,
  ServerResponseEvents,
  StartGameRequest,
} from "@imposter/shared";
import { RoomService, WebSocketManager, SessionService, GameRoom, GameEngine } from "../../core";
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
              id: r.id,
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
      if (room.currentGame) this.handleGetGameState(req, payload);
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
      const session = this.services.session.getSession(req.sessionId);
      const room = this.services.room.getRoomByMember(session.profile.id);

      if (room.hostId && room.hostId !== session.profile.id) throw new Error("Only host can start games");

      let game: WordImposterGameEngine;
      switch (payload.gameType) {
        case "imposter":
          game = new WordImposterGameEngine({
            minPlayers: 3,
            maxPlayers: 20,
            settings: payload.settings,
          });
          break;
        default:
          throw new Error("Unknown game type");
      }

      const result = game.startGame(room.members.slice());
      if (result) {
        this.services.room.setGame(room.roomId, game);
        this.broadcastGameState(room.currentGame, room.members);
      }
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

  handleGameAction = (req: AuthenticatedRequest, payload: GameActionRequest<any>["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      const room = this.services.room.getRoomByMember(session.profile.id);

      if (!room.currentGame) throw new Error("Invalid");

      room.currentGame.validateGameAction(session.profile.id, payload);
      room.currentGame.processAction(session.profile.id, payload);
      this.broadcastGameState(room.currentGame, room.members);
    } catch (err) {
      console.log("HandleGameAction error:", err);
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: "game.action_failed",
          message: err.message,
        },
      });
    }
  };

  handleGetGameState = (req: AuthenticatedRequest, payload: GameStateRequest<any>["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      const room = this.services.room.getRoomByMember(session.profile.id);
      const member = room.members.find((m) => m.id === session.profile.id);

      if (!room.currentGame || !member) throw new Error("Invalid");

      const state = room.currentGame.getPlayerViewState(member);
      this.wsManager.send(session.connectionId, {
        type: "game_state",
        payload: { state },
      });
    } catch (err) {
      console.log("handleGetGameState error:", err);
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: "game.state_failed",
          message: err.message,
        },
      });
    }
  };

  private broadcastRoomJoined(room: GameRoom) {
    const event: RoomJoinedResponse = {
      type: "room_joined",
      payload: {
        roomCode: room.roomCode,
        roomName: room.name,
        hostId: room.hostId,
        members: room.members.map((r) => {
          return {
            displayName: r.displayName,
            id: r.id,
            role: r.role,
          };
        }),
      },
    } as const;

    for (const member of room.members) {
      const sessionProfile = this.services.session.getSessionByProfileId(member.id);
      this.wsManager.send(sessionProfile.connectionId, event);
    }
  }

  private broadcastGameState(game: GameEngine<any>, members: RoomMember[]) {
    for (const member of members) {
      const sessionProfile = this.services.session.getSessionByProfileId(member.id);
      const state = game.getPlayerViewState(member);

      this.wsManager.send(sessionProfile.connectionId, {
        type: "game_state",
        payload: {
          state,
        },
      });
    }
  }
}
