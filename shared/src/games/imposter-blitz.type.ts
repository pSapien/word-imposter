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

export class ImposterBlizRoundEndEvent {
  type: WordImposterRoundSummary["type"];
  eliminatedPlayerId: string;

  constructor(summary: WordImposterRoundSummary) {
    this.type = summary.type;
    this.eliminatedPlayerId = "";

    if (summary.type === "civilian-found" || summary.type === "imposter-found") {
      this.eliminatedPlayerId = summary.eliminatedPlayerId;
    }
  }
}

export type ImposterBlitzEvent = ImposterBlitzSubmissionEvent | ImposterBlitzVoteEvent | ImposterBlizRoundEndEvent;

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
