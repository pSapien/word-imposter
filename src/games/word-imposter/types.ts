import type { BaseGameState, GameSettings } from "../types";

export interface WordImposterGameState extends BaseGameState {
  stage: "discussion" | "voting" | "results";
  word: string;
  isImposter: boolean;
  votes: Record<string, string>;
  roundResults?: {
    eliminatedPlayerId?: string;
    imposterFound: boolean;
    imposterWord: string;
  };
}

export interface WordImposterSettings extends GameSettings {
  imposterCount: number;
  wordCategories: string[];
}

export type WordImposterAction =
  | { type: "start_voting" }
  | { type: "cast_vote"; data: { targetId: string } }
  | { type: "finish_voting" }
  | { type: "next_round" };
