export interface Player {
  id: string;
  name: string;
  role: "civilian" | "impostor" | "mr-white";
  word: string | null;
  hasRevealed: boolean;
  vote: string | null;
}

export interface GameRoom {
  id: string;
  hostId: string;
  players: Player[];
  gameState: "waiting" | "revealing" | "discussion" | "voting" | "results";
  currentRevealIndex: number;
  wordPair: { civilian: string; impostor: string } | null;
  votes: Record<string, string[]>;
  createdAt: string;
}
