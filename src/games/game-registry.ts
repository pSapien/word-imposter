// Central registry for all available games
export interface GameInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // For tile styling
  minPlayers: number;
  maxPlayers: number;
  estimatedTime: string;
}

export const AVAILABLE_GAMES: GameInfo[] = [
  {
    id: "imposter",
    name: "Word Imposter",
    description: "Find the imposter who has a different word",
    icon: "🎭",
    color: "from-purple-500 to-pink-500",
    minPlayers: 3,
    maxPlayers: 20,
    estimatedTime: "10-15 min",
  },
  {
    id: "codewords",
    name: "CodeWords",
    description: "Team-based word association game",
    icon: "🕵️",
    color: "from-blue-500 to-teal-500",
    minPlayers: 4,
    maxPlayers: 16,
    estimatedTime: "15-20 min",
  },
];

export function getGameInfo(gameId: string): GameInfo | null {
  return AVAILABLE_GAMES.find((game) => game.id === gameId) || null;
}
