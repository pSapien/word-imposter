export interface Player {
  id: string;
  name: string;
  isOnline: boolean;
}

export interface Room {
  id: string;
  name: string;
  hostId: string;
  players: Map<string, Player>;
  spectators: Map<string, Player>;
  createdAt: number;
  currentGame?: Game;
  settings: {};
}

export interface Game {
  id: string;
  roomId: string;
  imposterIds: string[];
  imposterWord: string;
  civilianWord: string;
}

export type WordPair = [string, string];

export interface IWordPairManager {
  getRandomWordPair: () => { civilianWord: string; imposterWord: string };
}

export interface ClientEvents {
  "player:connect": { playerName: string };
  "player:reconnect": { playerId: string; sessionToken: string };
  "room:create": { roomName: string };
  "room:join": { roomId: string };
  "room:kick": { playerId: string; roomId: string };
  "game:start": { roomId: string };
}

export interface ServerEvents {
  "player:connected": { player: Player; sessionToken: string };
  "player:reconnected": { player: Player };
  "room:updated": { room: Room };
  "game:started": { game: Game };
  error: { code: string; message: string; details?: any };

  "room:player_left": { playerId: string };
  heartbeat: { timestamp: number };
}

export type BunSocket = Bun.ServerWebSocket<unknown>;
