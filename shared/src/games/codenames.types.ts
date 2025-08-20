export type CodenamesStateTeam = "red" | "blue";

export type CodenameGameConfig = {
  assasinWordsCount: number;
  totalWords: number;
};

export type CodenamesState = {
  keyCards: Array<{
    assignment: CodenamesStateTeam | "neutral" | "assasin" | "hidden";
    word: string;
  }>;
  revealedWords: string[];
  summary?: {
    winner: CodenamesStateTeam | "assasin";
  };
};
