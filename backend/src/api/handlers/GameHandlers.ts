import { ServerResponseEvents, RoomMember } from "@imposter/shared";
import { WebSocketManager, RoomService, SessionService, GameEngine, Room } from "../../core";

import { WordImposterGameEngine } from "../../games/imposter/WordImposterGame.js";

export interface GameActionRequest {
  type: "game_action";
  payload: {
    actionType: string;
    gameId?: string;
    data?: any;
  };
}

export interface StartGameRequest {
  type: "start_game";
  payload: {
    gameType: string;
    settings: Record<string, any>;
  };
}

type Services = {
  session: SessionService;
  room: RoomService;
};

export class GameHandlers {
  constructor(private wsManager: WebSocketManager<ServerResponseEvents>, private services: Services) {}

  handleStartGame = (connectionId: string, payload: StartGameRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(connectionId);
      const room = this.services.room.getRoomByMember(session.profile.id);
      const activePlayers = room.members.filter((m) => m.role !== "spectator");

      if (!room) throw new Error("Room not found");
      if (room.hostId && room.hostId !== session.profile.id) throw new Error("Only the host can start the game");
      if (activePlayers.length < room.settings.minPlayers) throw new Error("Need at least 2 players to start");

      const gameEngine = this.createGameEngine(payload.gameType, payload.settings, room);

      if (!gameEngine) throw new Error(`Unsupported game type: ${payload.gameType}`);

      // Start the game
      const gameStarted = gameEngine.startGame(room.members.slice());
      if (!gameStarted) throw new Error("Failed to start game");

      // Set the game in the room
      this.services.room.setGame(room.roomId, gameEngine);
      this.broadcastGameState(room);

      console.log(`${payload.gameType} game started in room ${room.roomCode} with ${activePlayers.length} players`);
    } catch (error) {
      this.wsManager.send(connectionId, {
        type: "error",
        payload: {
          code: "game.start_failed",
          message: error instanceof Error ? error.message : "Failed to start game",
        },
      });
    }
  };

  handleGameAction = (connectionId: string, payload: GameActionRequest["payload"]) => {
    try {
      const session = this.services.session.getSession(connectionId);
      const room = this.services.room.getRoomByMember(session.profile.id);

      if (!room?.currentGame) {
        throw new Error("No active game found");
      }

      // Validate game ID if provided
      if (payload.gameId && room.currentGame.gameId !== payload.gameId) {
        throw new Error("Invalid game ID");
      }

      // Process the action through the game engine
      room.currentGame.processAction(session.profile.id, {
        type: payload.actionType,
        playerId: session.profile.id,
        payload: payload.data,
      });

      // Update room status based on game status
      if (room.currentGame.status === "finished") {
        room.status = "finished";
      }

      // Broadcast updated game state to all members
      this.broadcastGameState(room);

      console.log(`Game action ${payload.actionType} processed for player ${session.profile.id} in room ${room.code}`);
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
      const session = this.services.session.getSession(connectionId);

      if (!session) {
        throw new Error("Authentication required");
      }

      const room = this.services.room.getRoomByMember(session.profile.id);

      if (!room) {
        this.wsManager.send(connectionId, {
          type: "get_game_state",
          payload: {
            gameState: null,
          },
        });
        return;
      }

      if (!room.currentGame) {
        this.wsManager.send(connectionId, {
          type: "get_game_state",
          payload: {
            gameState: null,
          },
        });
        return;
      }

      const member = room.members.find((m) => m.profileId === session.profile.id);

      if (!member) {
        throw new Error("Member not found in room");
      }

      // Get personalized state from the game engine
      const personalizedState = room.currentGame.getPlayerViewState(member);

      // Add common game information that all games need
      const gameStateResponse = {
        ...personalizedState,
        gameId: room.currentGame.gameId,
        gameStatus: room.currentGame.status,
        gameType: room.currentGame.constructor.name.toLowerCase().replace("gameengine", ""),
      };

      this.wsManager.send(connectionId, {
        type: "get_game_state",
        payload: {
          gameState: gameStateResponse,
        },
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

  handleLeaveGame = (connectionId: string) => {
    try {
      const session = this.services.session.getSession(connectionId);
      const room = this.services.room.getRoomByMember(session.profile.id);

      if (!room?.currentGame) {
        return; // No active game to leave
      }

      // Remove player from game if the engine supports it
      if ("removePlayer" in room.currentGame && typeof room.currentGame.removePlayer === "function") {
        const playerRemoved = room.currentGame.removePlayer(session.profile.id);

        if (playerRemoved) {
          console.log(`Player ${session.profile.id} left the game in room ${room.code}`);
        }
      }

      // Check if game should end due to insufficient players
      const shouldEndGame = this.shouldEndGame(room.currentGame, room);

      if (shouldEndGame) {
        room.currentGame = null;
        room.status = "waiting";

        // Notify remaining players that game ended
        this.broadcastToRoom(room, {
          type: "get_game_state",
          payload: {
            gameState: null,
          },
        });
      } else {
        // Broadcast updated game state
        this.broadcastGameState(room);
      }
    } catch (error) {
      console.error("Error handling leave game:", error);
    }
  };

  // Method to handle player disconnection
  handlePlayerDisconnect = (profileId: string) => {
    try {
      const room = this.services.room.getRoomByMember(profileId);

      if (room?.currentGame) {
        // Remove player from current game
        if ("removePlayer" in room.currentGame && typeof room.currentGame.removePlayer === "function") {
          room.currentGame.removePlayer(profileId);
        }

        // Check if game should end
        const shouldEndGame = this.shouldEndGame(room.currentGame, room);

        if (shouldEndGame) {
          room.currentGame = null;
          room.status = "waiting";

          this.broadcastToRoom(room, {
            type: "get_game_state",
            payload: {
              gameState: null,
            },
          });
        } else {
          this.broadcastGameState(room);
        }
      }
    } catch (error) {
      console.error("Error handling player disconnect:", error);
    }
  };

  // Private method to create game engines based on type
  private createGameEngine(gameType: string, settings: Record<string, any>, room: any): GameEngine<any> | null {
    try {
      switch (gameType) {
        case "imposter": {
          const config = {
            minPlayers: 3,
            maxPlayers: 20,
            settings: {
              imposterCount: settings.imposterCount || 1,
              wordCategories: settings.wordCategories || ["general"],
              discussionTimeMs: settings.discussionTimeMs || 300000,
              votingTimeMs: settings.votingTimeMs || 120000,
            },
          };

          return new WordImposterGameEngine(config);
        }

        // Add more game types here as they're developed
        // case "codegame": {
        //   const { CodeGameEngine } = require("../games/codegames/CodeGameEngine");
        //   return new CodeGameEngine(settings);
        // }

        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to create game engine for type ${gameType}:`, error);
      return null;
    }
  }

  // Private method to determine if game should end
  private shouldEndGame(gameEngine: GameEngine<any>, room: any): boolean {
    // Check if game is already finished
    if (gameEngine.status === "finished") {
      return true;
    }

    // Check if game engine has method to get active player count
    if ("getActivePlayerCount" in gameEngine && typeof gameEngine.getActivePlayerCount === "function") {
      return gameEngine.getActivePlayerCount() < 2;
    }

    // Fallback: check room members
    const activePlayers = room.members.filter((m: RoomMember) => m.role !== "spectator");
    return activePlayers.length < 2;
  }

  // Utility method to broadcast game state to all room members
  private broadcastGameState(room: Room) {
    room.members.forEach((member: RoomMember) => {
      const sessionProfile = this.services.session.getSessionByProfileId(member.profileId);
      if (sessionProfile) {
        try {
          const personalizedState = room.currentGame.getPlayerViewState(member);

          // Add common game information
          const gameStateResponse = {
            ...personalizedState,
            gameId: room.currentGame.gameId,
            gameStatus: room.currentGame.status,
            gameType: room.currentGame.constructor.name.toLowerCase().replace("gameengine", ""),
          };

          this.wsManager.send(sessionProfile.connectionId, {
            type: "get_game_state",
            payload: {
              gameState: gameStateResponse,
            },
          });
        } catch (error) {
          console.error(`Failed to send game state to ${member.profileId}:`, error);
        }
      }
    });
  }

  // Utility method to broadcast a message to all room members
  private broadcastToRoom(room: any, message: any) {
    room.members.forEach((member: RoomMember) => {
      const sessionProfile = this.services.session.getSessionByProfileId(member.profileId);
      if (sessionProfile) {
        this.wsManager.send(sessionProfile.connectionId, message);
      }
    });
  }
}
