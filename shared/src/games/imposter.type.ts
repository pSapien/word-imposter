export interface WordImposterState {
  stage: "setup" | "discussion" | "voting" | "results" | "finished";
  round: number;
  imposterIds: string[];
  civilianWord: string;
  imposterWord: string;
  votes: Record<string, string>;
  roundResults?: {
    eliminatedPlayerId?: string;
    imposterFound: boolean;
    imposterWord: string;
    civilianWord: string;
    gameOver: boolean;
    winner?: "imposters" | "civilians";
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
