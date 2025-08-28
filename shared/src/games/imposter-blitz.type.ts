import type { WordImposterRoundSummary, WordImposterConfig } from "./imposter.type.ts";

export interface ImposterBlizGameConfig extends WordImposterConfig {}

export class ImposterBlitzSubmissionEvent {
  type = "submission";
  constructor(public playerId: string, public content: string) {}
}

export class ImposterBlitzVoteEvent {
  type = "vote";
  constructor(public voterId: string, public voteeId: string) {}
}

export type ImposterBlitzEvent = ImposterBlitzSubmissionEvent | ImposterBlitzVoteEvent;

export interface ImposterBlitzPlayer {
  id: string;
  displayName: string;
  role: "host" | "player" | "spectator" | string;
  status: "alive" | "eliminated";
  hasVoted: boolean;
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
  events: ImposterBlitzEvent[];
  summary?: WordImposterRoundSummary;
}
