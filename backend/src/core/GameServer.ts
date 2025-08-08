import { GameEngine } from "./GameEngine.js";
import { GameEventEmitter } from "./GameEventEmitter.js";
import { WordPairManager } from "./WordPairManager.js";

import { WORD_PAIRS } from "../wordpairs.js";
import type { ClientEvents, BunSocket } from "./types.js";

type HandlerMethod = (ws: BunSocket, data: any) => void;

export class ImposterGameServer implements BunSocketHandler<unknown> {
  private gameEngine: GameEngine;
  private eventEmitter: GameEventEmitter;
  private wordPairManager: WordPairManager;
  private heartbeatInterval: NodeJS.Timeout;
  private eventHandlers: Record<keyof ClientEvents, HandlerMethod>;

  constructor() {
    this.wordPairManager = new WordPairManager(WORD_PAIRS);
    this.eventEmitter = new GameEventEmitter();
    this.gameEngine = new GameEngine(this.wordPairManager);

    // Start heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.broadcastHeartbeat();
    }, 30000);

    this.eventHandlers = {
      "player:connect": this.handlePlayerConnect.bind(this),
      "player:reconnect": this.handlePlayerReconnect.bind(this),
      "room:create": this.handleRoomCreate.bind(this),
      "room:join": this.handleRoomJoin.bind(this),
      "room:kick": this.handleRoomKick.bind(this),
      "game:start": this.handleGameStart.bind(this),
    };
  }
  message(ws: BunSocket, data: string | Buffer) {
    try {
      const { type, payload } = JSON.parse(data as string);
      this.handleClientEvent(ws, type, payload);
    } catch (err) {
      // Optionally log or handle the error here
    }
  }

  open?(ws: BunSocket): void | Promise<void> {}
  close?(ws: BunSocket, code: number, reason: string): void | Promise<void> {}

  private handleClientEvent(ws: BunSocket, event: keyof ClientEvents, data: any): void {
    try {
      const handler = this.eventHandlers[event];
      if (handler) {
        handler(ws, data);
      } else {
        this.eventEmitter.emitToSocket(ws, "error", {
          code: "UNKNOWN_EVENT",
          message: `Unknown event: ${event}`,
        });
      }
    } catch (error) {
      console.error(`Error handling ${event}:`, error);
      this.eventEmitter.emitToSocket(ws, "error", {
        code: "HANDLER_ERROR",
        message: error instanceof Error ? error.message : "Unknown error",
        details: { event, data },
      });
    }
  }

  private handlePlayerConnect(ws: BunSocket, data: ClientEvents["player:connect"]): void {
    const { player, sessionToken } = this.gameEngine.createPlayer(data.playerName);
    this.eventEmitter.addPlayerSocket(player.id, ws);

    this.eventEmitter.emitToSocket(ws, "player:connected", {
      player,
      sessionToken,
    });
  }

  private handlePlayerReconnect(ws: BunSocket, data: ClientEvents["player:reconnect"]): void {
    const player = this.gameEngine.reconnectPlayer(data.playerId, data.sessionToken);
    if (!player) {
      this.eventEmitter.emitToSocket(ws, "error", {
        code: "INVALID_SESSION",
        message: "Invalid session token or player ID",
      });
      return;
    }

    this.eventEmitter.addPlayerSocket(player.id, ws);
    this.eventEmitter.emitToSocket(ws, "player:reconnected", { player });
  }

  private handleRoomCreate(ws: BunSocket, data: ClientEvents["room:create"]): void {
    const playerId = this.eventEmitter.getPlayerId(ws);
    if (!playerId) {
      this.eventEmitter.emitToSocket(ws, "error", {
        code: "NOT_AUTHENTICATED",
        message: "Player not authenticated",
      });
      return;
    }

    const room = this.gameEngine.createRoom(playerId, data.roomName);
    this.eventEmitter.emitToSocket(ws, "room:updated", { room });
  }

  private handleRoomJoin(ws: BunSocket, data: ClientEvents["room:join"]): void {
    const playerId = this.eventEmitter.getPlayerId(ws);
    if (!playerId) {
      this.eventEmitter.emitToSocket(ws, "error", {
        code: "NOT_AUTHENTICATED",
        message: "Player not authenticated",
      });
      return;
    }

    const room = this.gameEngine.joinRoom(playerId, data.roomId);
    this.eventEmitter.broadcast(room, "room:updated", { room });
  }

  private handleRoomKick(ws: BunSocket, data: ClientEvents["room:kick"]): void {
    const hostId = this.eventEmitter.getPlayerId(ws);
    if (!hostId) return;

    const room = this.gameEngine.getRoom(data.roomId);
    if (!room || room.hostId !== hostId) {
      this.eventEmitter.emitToSocket(ws, "error", {
        code: "UNAUTHORIZED",
        message: "Only host can kick players",
      });
      return;
    }

    const updatedRoom = this.gameEngine.leaveRoom(data.playerId, data.roomId);
    if (updatedRoom) this.eventEmitter.broadcast(updatedRoom, "room:updated", { room: updatedRoom });
  }

  private handleGameStart(ws: BunSocket, data: ClientEvents["game:start"]): void {
    const hostId = this.eventEmitter.getPlayerId(ws);
    const room = this.gameEngine.getRoom(data.roomId);
    if (!room) return;

    const game = this.gameEngine.startGame(room.id, hostId);
    this.eventEmitter.broadcast(room, "game:started", { game });
  }

  private handleDisconnection(ws: BunSocket): void {}

  private broadcastHeartbeat(): void {
    const heartbeat = { timestamp: Date.now() };

    // for (const [playerId, _] of this.eventEmitter["playerSockets"]) {
    //   this.eventEmitter.emitToPlayer(playerId, "heartbeat", heartbeat);
    // }
  }

  shutdown(): void {
    clearInterval(this.heartbeatInterval);
  }
}
