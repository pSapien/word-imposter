import { ServerResponseEvents } from "@imposter/shared";
import { WebSocketManager, RoomService, GameEngine, SessionService } from "../../core";

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
      if (!room?.currentGame) throw new Error("No active game found");

      room.currentGame.processAction({
        type: payload.actionType,
        playerId: session.profile.id,
        data: payload.data,
      });

      room.members.forEach((member) => {
        const personalizedState = room.currentGame.getPersonalizedState(member);
        const sessionProfile = this.services.session.getSessionByProfileId(member.profileId);
        this.wsManager.send(sessionProfile.connectionId, {
          type: "game_state",
          payload: {
            state: personalizedState,
          },
        });
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
}
