import type { WordImposterRoundSummary, WordImposterConfig } from "./imposter.type.ts";

export interface ImposterBlizGameConfig extends WordImposterConfig {}

export interface ImposterBlitzPlayer {
  id: string;
  displayName: string;
  role: "host" | "player" | "spectator" | string;
  status: "alive" | "eliminated";
  hasVoted: boolean;
  submittedWords: Array<string>;
}

export interface ImposterBlitzGameState {
  stage: "waiting" | "discussion" | "voting" | "results";
  round: number;
  imposterIds: string[];
  civilianWord: string;
  imposterWord: string;
  players: ImposterBlitzPlayer[];
  votes: Record<string, string>;
  turnOrder: string[];
  turn: string;
  summary?: WordImposterRoundSummary;
}
