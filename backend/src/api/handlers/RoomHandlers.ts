import type {
  AuthenticatedRequest,
  CreateRoomRequest,
  GameActionRequest,
  GameStateRequest,
  JoinRoomRequest,
  KickRoomMemberRequest,
  RoomJoinedResponse,
  RoomMember,
  ServerResponseEvents,
  StartGameRequest,
} from "@imposter/shared";
import { ErrorCodes, Validators, ApiError } from "@imposter/shared";
import type { RoomService, WebSocketManager, SessionService, GameRoom, GameEngine } from "@server/core";
import { WordImposterGameEngine, ImposterBlitzGameEngine } from "@server/games";

type Services = {
  session: SessionService;
  room: RoomService;
};

export class RoomHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  handleCreateRoom = (req: AuthenticatedRequest, payload: CreateRoomRequest["payload"]) => {
    try {
      Validators.validateRoomName(payload.roomName);
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      const room = this.services.room.create(session.profile, payload.roomName);

      this.wsManager.send(req.connectionId, {
        type: "room_created",
        payload: {
          roomName: room.name,
          hostId: room.hostId,
          roomId: room.roomId,
          members: room.members.map((r) => {
            return {
              displayName: r.displayName,
              id: r.id,
              role: r.role,
              status: r.status,
            };
          }),
        },
      });
    } catch (error: any) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.roomCreateFailed,
          message: error?.message ?? "Failed to create room",
        },
      });
    }
  };

  handleJoinRoom = (req: AuthenticatedRequest, payload: JoinRoomRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      const room = this.services.room.join(payload.roomName, session.profile, payload.role);
      this.broadcastRoomJoined(room);

      if (room.currentGame) {
        const member = room.members.find((m) => m.id === session.profile.id);
        if (!member) throw new Error("Members not found");
        this.broadcastGameState(room.currentGame, room.members);
      }
    } catch (error: any) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.roomJoinedFailed,
          message: error?.message ?? "Failed to join room",
        },
      });
    }
  };

  handleKickRoomMember = (req: AuthenticatedRequest, payload: KickRoomMemberRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      const hostId = session.profile.id;
      const room = this.services.room.kickMember(hostId, payload.roomId, payload.memberId);
      this.broadcastRoomJoined(room);
    } catch (error: any) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.roomKickedFailed,
          message: "Failed to leave room",
        },
      });
    }
  };

  handleLeaveRoom = (req: AuthenticatedRequest) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      const room = this.services.room.leave(session.profile.id);
      if (!room) return null;

      this.broadcastRoomJoined(room);
    } catch (error) {
      console.error("Error handling leave room:", error);
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: ErrorCodes.roomLeaveFailed,
          message: "Failed to leave room",
        },
      });
    }
  };

  handleStartGame = (req: AuthenticatedRequest, payload: StartGameRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      let room = this.services.room.getRoomByMember(session.profile.id);
      if (!room) throw new Error("Member not joined yet!");

      if (room.hostId && room.hostId !== session.profile.id) throw new Error("Only host can start games");

      let game: GameEngine<any>;
      switch (payload.gameType) {
        case "imposter":
          game = new WordImposterGameEngine({
            minPlayers: 3,
            maxPlayers: 20,
            imposterCount: payload.settings?.imposterCount || 1,
            wordCategories: payload.settings?.wordCategories || ["legacy"],
          });
          break;
        case "imposter-blitz":
          game = new ImposterBlitzGameEngine({
            minPlayers: 3,
            maxPlayers: 20,
            imposterCount: payload.settings?.imposterCount || 1,
            wordCategories: payload.settings?.wordCategories || ["legacy"],
          });
          break;
        default:
          throw new Error("Unknown game type");
      }

      this.services.room.setGame(room, game);
      game.startGame(room.members.slice());

      this.broadcastGameState(room.currentGame!, room.members);
    } catch (error: any) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.gameStartFailed,
          message: error instanceof Error ? error.message : "Failed to start game",
        },
      });
    }
  };

  handleGameAction = (req: AuthenticatedRequest, payload: GameActionRequest<any>["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      const room = this.services.room.getRoomByMember(session.profile.id);
      if (!room) throw new Error("Member not joined yet!");
      this.services.room.updateLastActive(room.roomId);

      if (!room.currentGame) throw new Error("No Current Game");

      room.currentGame.validateGameAction(session.profile.id, payload);
      room.currentGame.processAction(session.profile.id, payload);
      this.broadcastGameState(room.currentGame!, room.members);
    } catch (error: any) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.gameActionFailed,
          message: error instanceof Error ? error.message : "Failed to handle game action",
        },
      });
    }
  };

  handleGetGameState = (req: AuthenticatedRequest, payload: GameStateRequest<any>["payload"]) => {
    try {
      const session = this.services.session.getSession(req.sessionId);
      if (!session) throw new ApiError(ErrorCodes.authSessionNotFound, "Session not found");

      const room = this.services.room.getRoomByMember(session.profile.id);
      if (!room) throw new ApiError(ErrorCodes.roomMemberNotFound, "Member not joined yet!");
      if (!room.currentGame) throw new ApiError(ErrorCodes.gameNotFound, "Game Not Found in the room");

      this.services.room.updateLastActive(room.roomId);

      const state = room.currentGame.getPlayerViewState(session.profile.id);
      this.wsManager.send(session.connectionId, {
        type: "game_state",
        payload: { state },
      });
    } catch (error: any) {
      this.wsManager.send(req.connectionId, {
        type: "error",
        payload: {
          code: error?.code ?? ErrorCodes.gameStateFailed,
          message: error instanceof Error ? error.message : "Failed to get game state",
        },
      });
    }
  };

  private broadcastRoomJoined(room: GameRoom) {
    const event: RoomJoinedResponse = {
      type: "room_joined",
      payload: {
        roomName: room.name,
        hostId: room.hostId,
        roomId: room.roomId,
        members: room.members.map((r) => {
          return {
            displayName: r.displayName,
            id: r.id,
            role: r.role,
            status: r.status,
          };
        }),
      },
    } as const;

    for (const member of room.members) {
      const session = this.services.session.getSessionByProfileId(member.id);
      if (!session) continue;

      this.wsManager.send(session.connectionId, event);
    }
  }

  private broadcastGameState(game: GameEngine<any>, members: RoomMember[]) {
    for (const member of members) {
      const sessionProfile = this.services.session.getSessionByProfileId(member.id);
      if (!sessionProfile) continue;

      this.wsManager.send(sessionProfile.connectionId, {
        type: "game_state",
        payload: {
          state: game.getPlayerViewState(member.id),
        },
      });
    }
  }
}
