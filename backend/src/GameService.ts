import { v4 as uuidv4 } from "uuid";
import type { GameRoom, Player, GameConfig } from "./types.js";

export class GameService {
  private rooms = new Map<string, GameRoom>();
  private playerRooms = new Map<string, string>();

  private config: GameConfig = {
    minPlayers: 3,
    maxPlayers: 8,
  };

  createRoom(hostId: string, hostName: string): GameRoom {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const host: Player = {
      id: hostId,
      name: hostName,
      role: "civilian",
      word: "",
    };

    const room: GameRoom = {
      id: roomId,
      hostId,
      players: [host],
      gameState: "waiting",
      currentRevealIndex: 0,
      wordPair: null,
      votes: {},
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.playerRooms.set(hostId, roomId);
    return room;
  }

  joinRoom(roomId: string, playerId: string, playerName: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`Room of ${roomId} not found`);

    if (room.players.length >= this.config.maxPlayers) throw new Error(`Maximum players exceeded`);

    if (room.gameState !== "waiting") return null;

    const existingPlayer = room.players.find((p) => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.name = playerName;
      return room;
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      role: "civilian",
    };

    room.players.push(newPlayer);
    this.playerRooms.set(playerId, roomId);
    return room;
  }

  leaveRoom(playerId: string): GameRoom | null {
    const roomId = this.playerRooms.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.players = room.players.filter((p) => p.id !== playerId);
    this.playerRooms.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomId);
      return null;
    }

    // TODO: If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
    }

    return room;
  }

  startGame(roomId: string, hostId: string): GameRoom | null {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostId) return null;
    if (room.players.length < this.config.minPlayers) return null;
    if (room.gameState !== "waiting") return null;

    // Assign roles and words
    this.assignRolesAndWords(room);
    room.gameState = "revealing";
    room.currentRevealIndex = 0;

    return room;
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null;
  }

  getPlayerRoom(playerId: string): GameRoom | null {
    const roomId = this.playerRooms.get(playerId);
    return roomId ? this.rooms.get(roomId) || null : null;
  }

  private assignRolesAndWords(room: GameRoom): void {}

  cleanupOldRooms(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000;

    this.rooms.forEach((room, roomId) => {
      if (now.getTime() - room.createdAt.getTime() > maxAge) {
        room.players.forEach((player) => {
          this.playerRooms.delete(player.id);
        });
        this.rooms.delete(roomId);
      }
    });
  }
}
