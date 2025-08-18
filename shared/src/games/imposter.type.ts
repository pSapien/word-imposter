export interface WordImposterState {
  stage: "setup" | "discussion" | "voting" | "results" | "finished";
  round: number;
  imposterIds: string[];
  civilianWord: string;
  imposterWord: string;
  votes: Record<string, string>;
  eliminatedPlayerIds: string[];
  roundResults?: {
    imposterFound: boolean;
    imposterWord: string;
    eliminatedPlayerId: string | null;
    winner: "imposters" | "civilians" | null;
  };
}

export interface WordImposterConfig {
  minPlayers: number;
  maxPlayers: number;
  settings: {
    imposterCount: number;
    wordCategories: string[];
    discussionTimeMs?: number;
    votingTimeMs?: number;
  };
}
