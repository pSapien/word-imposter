import type { Room, ServerEvents, BunSocket } from "./types.js";

export class GameEventEmitter {
  private playerSockets = new Map<string, BunSocket>();
  private socketToPlayer = new Map<BunSocket, string>();

  addPlayerSocket(playerId: string, socket: BunSocket): void {
    this.playerSockets.set(playerId, socket);
    this.socketToPlayer.set(socket, playerId);
  }

  removePlayerSocket(playerId: string): void {
    const socket = this.playerSockets.get(playerId);
    if (socket) {
      this.playerSockets.delete(playerId);
      this.socketToPlayer.delete(socket);
    }
  }

  removeSocket(socket: BunSocket): void {
    const playerId = this.socketToPlayer.get(socket);
    if (playerId) {
      this.playerSockets.delete(playerId);
      this.socketToPlayer.delete(socket);
    }
  }

  emitToPlayer<K extends keyof ServerEvents>(playerId: string, event: K, data: ServerEvents[K]): void {
    const socket = this.playerSockets.get(playerId);
    if (socket) this.emitToSocket(socket, event, data);
  }

  emitToSocket<K extends keyof ServerEvents>(socket: BunSocket, event: K, data: ServerEvents[K]): void {
    try {
      socket.send(JSON.stringify({ event, data }));
    } catch (error) {
      console.error("Failed to emit to socket:", error);
    }
  }

  broadcast<K extends keyof ServerEvents>(room: Room, event: K, data: ServerEvents[K]): void {
    for (const playerId of Array.from(room.players.keys())) {
      this.emitToPlayer(playerId, event, data);
    }

    for (const spectatorId of Array.from(room.spectators.keys())) {
      this.emitToPlayer(spectatorId, event, data);
    }
  }

  getPlayerId(socket: BunSocket): string | undefined {
    return this.socketToPlayer.get(socket);
  }
}
