import { IdGenerator } from "./IDGenerator.js";
import type { IWordPairManager, Room, Player, Game } from "./types.js";
import { arrRandom } from "./random.js";

export class GameEngine {
  private rooms = new Map<string, Room>();
  private players = new Map<string, Player>();
  private sessions = new Map<string, string>();

  constructor(private wordPairManager: IWordPairManager) {}

  createPlayer(name: string): { player: Player; sessionToken: string } {
    const player: Player = {
      id: IdGenerator.generatePlayerId(),
      name: name.trim(),
      isOnline: true,
    };

    const sessionToken = IdGenerator.generateSessionToken();
    this.players.set(player.id, player);
    this.sessions.set(sessionToken, player.id);

    return { player, sessionToken };
  }

  reconnectPlayer(playerId: string, sessionToken: string): Player | null {
    if (this.sessions.get(sessionToken) !== playerId) {
      return null;
    }

    const player = this.players.get(playerId);
    if (!player) return null;

    player.isOnline = true;
    this.players.set(playerId, player);

    return player;
  }

  createRoom(hostId: string, roomName: string): Room {
    const host = this.players.get(hostId);
    if (!host) throw new Error("Host player not found");

    const players = new Map();
    players.set(hostId, host);

    const room: Room = {
      id: IdGenerator.generateRoomId(),
      name: roomName,
      hostId,
      players,
      spectators: new Map(),
      createdAt: Date.now(),
      settings: {},
    };

    this.rooms.set(room.id, room);
    return room;
  }

  joinRoom(playerId: string, roomId: string, asSpectator = false): Room {
    const player = this.players.get(playerId);
    if (!player) throw new Error("Player not found");

    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");

    if (asSpectator) {
      room.spectators.set(playerId, player);
    } else {
      room.players.set(playerId, player);
    }

    this.rooms.set(room.id, room);

    return room;
  }

  leaveRoom(playerId: string, roomId: string): Room | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const wasPlayer = room.players.delete(playerId);
    const wasSpectator = room.spectators.delete(playerId);

    if (!wasPlayer && !wasSpectator) return room;

    if (room.hostId === playerId) {
      if (room.players.size === 0) {
        this.rooms.delete(roomId);
        return null;
      }

      /** the next in line becomes the host  */
      room.hostId = room.players.keys().next().value;
    }

    this.rooms.set(room.id, room);
    return room;
  }

  startGame(roomId: string, hostId: string): Game {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.hostId !== hostId) throw new Error("Only host can start game");
    if (room.players.size < 3) throw new Error("Need at least 3 players");
    if (room.currentGame) throw new Error("Game already in progress");

    const playerIds = Array.from(room.players.keys());
    const imposterCount = 1;
    const imposterIds = arrRandom(playerIds, imposterCount);

    const { civilianWord, imposterWord } = this.wordPairManager.getRandomWordPair();

    const game: Game = {
      id: IdGenerator.generateGameId(),
      roomId,
      imposterIds,
      imposterWord,
      civilianWord,
    };

    room.currentGame = game;
    this.rooms.set(roomId, room);
    return game;
  }

  private finishGame(game: Game, room: Room): void {}

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }
}
