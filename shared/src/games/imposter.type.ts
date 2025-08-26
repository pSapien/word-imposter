export interface WordImposterStatePlayer {
  id: string;
  displayName: string;
  role: "host" | "player" | "spectator" | string;
  status: "alive" | "eliminated";
  hasVoted: boolean;
  hasSubmittedWord: boolean;
}

export type WordImposterRoundSummary =
  | WordImposterImposterNextRoundSummary
  | WordImposterCiviliansWinSummary
  | WordImposterImpostersWinSummary
  | WordImposterTiedRoundSummary;

export interface WordImposterImposterNextRoundSummary {
  type: "civilian-found" | "imposter-found";
  winner: null;
  eliminatedPlayerId: string;
  remainingImposters: string[];
}

export interface WordImposterCiviliansWinSummary {
  type: "civilians-win";
  winner: "civilians";
  imposterPlayerIds: string[];
  imposterWord: string;
  civilianWord: string;
}

export interface WordImposterImpostersWinSummary {
  type: "imposters-win";
  winner: "imposters";
  remainingImposters: string[];
  civilianWord: string;
  imposterWord: string;
}

export interface WordImposterTiedRoundSummary {
  type: "votes-tied";
  winner: null;
}

export interface WordImposterState {
  stage: "waiting" | "discussion" | "voting" | "results";
  round: number;
  imposterIds: string[];
  civilianWord: string;
  imposterWord: string;
  players: WordImposterStatePlayer[];
  votes: Record<string, string>;
  playerWordSubmissions: Record<string, string>;
  summary?: WordImposterRoundSummary;
}

export interface WordImposterConfig {
  minPlayers: number;
  maxPlayers: number;
  imposterCount: number;
  wordCategories: string[];
}
