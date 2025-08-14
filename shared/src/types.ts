export type ImposterGameState = {
  imposterNames: string[];
  round: number;
  startedAt: number;
  imposterWord: string;
  civilianWord: string;
  wordCategories: string[];
  stage: "round_start" | "discussion" | "voting" | "round_finished";
  votes: Record<string, string>;
  eliminated: string[];
  summary: null | {
    isImposterFound: boolean;
    imposterWord: string;
    imposterSuspectName: string;
  };
};
