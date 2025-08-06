export interface Player {
  id: string;
  name: string;
  role: "civilian" | "impostor";
  word: string;
}

export interface WordPair {
  civilian: string;
  impostor: string;
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  gameState: "waiting" | "revealing" | "discussion" | "voting" | "results";
  currentRevealIndex: number;
  wordPair: WordPair | null;
  votes: Record<string, string[]>;
  createdAt: Date;
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
}
