import type { GameEngine, GameAction, GameEnginePlayer } from "@server/core";
import {
  type ImposterBlitzGameState,
  type WordImposterCiviliansWinSummary,
  type WordImposterImpostersWinSummary,
  type ImposterBlizGameConfig,
  ImposterBlitzVoteEvent,
  ImposterBlitzSubmissionEvent,
} from "@imposter/shared";
import { getRandomWordPair } from "../imposter/wordpairs.js";
import { computeWinner, getEliminatedPlayerByVotes, randomImposters } from "../imposter/logic/index.js";
import { shuffle } from "@server/utils";

export class ImposterBlitzGameEngine implements GameEngine<ImposterBlitzGameState> {
  readonly gameId: string;
  private state: ImposterBlitzGameState;
  private config: ImposterBlizGameConfig;

  constructor(config: ImposterBlizGameConfig) {
    this.config = config;
    this.gameId = `imposter-blitz-${Date.now()}`;

    this.state = {
      stage: "waiting",
      round: 0,
      players: [],
      imposterIds: [],
      civilianWord: "",
      imposterWord: "",
      turnOrder: [],
      votes: {},
      turn: "",
      events: [],
      summary: undefined,
    };
  }

  startGame(players: GameEnginePlayer[]): boolean {
    const wordPair = getRandomWordPair(this.config.wordCategories);
    const playingPlayerIds = players.filter((p) => p.role !== "spectator").map((p) => p.id);

    this.state.stage = "discussion";
    this.state.round = 1;

    this.state.players = players.map((player) => {
      return {
        displayName: player.displayName,
        id: player.id,
        status: "alive",
        role: player.role,
        hasVoted: false,
        submittedWords: [],
      };
    });

    this.state.imposterIds = randomImposters(playingPlayerIds, this.config.imposterCount || 1);
    this.state.civilianWord = wordPair.civilianWord;
    this.state.imposterWord = wordPair.imposterWord;
    this.state.turnOrder = shuffle(playingPlayerIds.slice());
    this.state.votes = {};
    this.state.turn = this.state.turnOrder[0]!;

    return true;
  }

  validateGameAction(playerId: string, action: GameAction<any>): void {
    const player = this.state.players.find((player) => player.id === playerId);
    if (!player) throw new Error("Player not found");

    if (action.type === "submit_word") {
      const repeated = this.state.events.some(
        (evt) =>
          evt instanceof ImposterBlitzSubmissionEvent &&
          evt.content.trim().toLowerCase() === action.payload.word.toLowerCase()
      );

      if (repeated) throw new Error("This word has already been submitted.");
      if (this.state.stage !== "discussion") throw new Error("Not the time to submit words.");
      if (player.role === "spectator") throw new Error("Spectator are not allowed to submit");
      if (player.status === "eliminated") throw new Error("Not allowed to submit");
    }

    if (action.type === "cast_vote") {
      if (this.state.stage !== "voting") throw new Error("This is not the stage for voting");
      if (player.status === "eliminated") throw new Error("Not allowed to vote");
      if (player.role === "spectator") throw new Error("Spectator are not allowed to vote");
    }

    if (action.type === "end_voting") {
      if (this.state.stage !== "voting") throw new Error("This is not the stage to end voting");
      if (player.role !== "host") throw new Error("Only host can end voting");
    }
  }

  processAction(playerId: string, action: GameAction<any>): void {
    const handlers: Record<string, (id: string, action: GameAction<any>) => void> = {
      submit_word: this.handleSubmitWord.bind(this),
      cast_vote: this.handleCastVote.bind(this),
      start_next_round: this.handleStartNextRound.bind(this),
      end_voting: this.handleEndVoting.bind(this),
    };

    const handler = handlers[action.type];
    if (handler) handler(playerId, action);
    else console.warn("Unknown Action", action.type);
  }

  getPlayerViewState(playerId: string) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("Player Not Found");

    /** spectator gets to see everything */
    if (player.role === "spectator") return this.state;

    const clientState = structuredClone(this.state);

    if (this.state.stage === "voting") {
      clientState.votes = pickVote(player.id, clientState.votes);
    }
    clientState.imposterWord = "";
    clientState.civilianWord = this.state.imposterIds.includes(player.id)
      ? this.state.imposterWord
      : this.state.civilianWord;

    /** client will never get the original turn order */
    clientState.turnOrder = shuffle(clientState.turnOrder);
    return clientState;
  }

  private handleSubmitWord(playerId: string, action: GameAction<any>) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("Player not found");

    this.state.events.push(new ImposterBlitzSubmissionEvent(player.id, action.payload.word));
    this.state.turnOrder.shift();
    const nextTurn = this.state.turnOrder[0]!;

    if (nextTurn === undefined) {
      this.state.stage = "voting";
    } else {
      this.state.turn = nextTurn;
    }
  }

  private handleCastVote(playerId: string, action: GameAction<any>) {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) throw new Error("Player not found");

    this.state.votes[playerId] = action.payload?.voteeId || "";
    player.hasVoted = true;
  }

  private handleEndVoting(playerId: string, action: GameAction<any>) {
    const eliminatedPlayers = getEliminatedPlayerByVotes(this.state.votes) as string[];
    const eliminatedPlayerId = eliminatedPlayers && eliminatedPlayers.length === 1 ? eliminatedPlayers[0] : null;

    this.state.stage = "results";

    if (!eliminatedPlayerId) {
      this.state.summary = {
        type: "votes-tied",
        winner: null,
      };
      return;
    }

    const eliminatedPlayer = this.state.players.find((p) => p.id === eliminatedPlayerId)!;
    eliminatedPlayer.status = "eliminated";

    const remainingImposters = this.state.imposterIds.filter(
      (id) => this.state.players.find((p) => p.id === id)?.status !== "eliminated"
    );
    const winner = computeWinner({
      players: this.state.players,
      imposterIds: this.state.imposterIds,
      remainingImposters,
    });

    if (winner === "imposters") {
      this.state.summary = {
        type: "imposters-win",
        winner: "imposters",
        imposterWord: this.state.imposterWord,
        civilianWord: this.state.civilianWord,
        remainingImposters: this.state.imposterIds.filter(
          (id) => this.state.players.find((p) => p.id === id)?.status !== "eliminated"
        ),
      } as WordImposterImpostersWinSummary;
      return;
    }

    if (winner === "civilians") {
      this.state.summary = {
        type: "civilians-win",
        winner: "civilians",
        imposterWord: this.state.imposterWord,
        civilianWord: this.state.civilianWord,
        imposterPlayerIds: this.state.players
          .filter((p) => p.status === "eliminated" && this.state.imposterIds.includes(p.id))
          .map((p) => p.id),
      } as WordImposterCiviliansWinSummary;
      return;
    }

    const eliminatedIsImposter = this.state.imposterIds.includes(eliminatedPlayerId);
    this.state.summary = {
      type: eliminatedIsImposter ? "imposter-found" : "civilian-found",
      winner: null,
      eliminatedPlayerId: eliminatedPlayerId,
      remainingImposters: this.state.imposterIds.filter(
        (id) => this.state.players.find((p) => p.id === id)?.status !== "eliminated"
      ),
    };
  }

  private handleStartNextRound() {
    const alivePlayerIds = this.state.players
      .filter((p) => p.role !== "spectator" && p.status === "alive")
      .map((p) => p.id);

    Object.keys(this.state.votes).forEach((voterId) => {
      this.state.events.push(new ImposterBlitzVoteEvent(voterId, this.state.votes[voterId]!));
    });

    this.state.stage = "discussion";
    this.state.summary = undefined;
    this.state.round += 1;
    this.state.votes = {};
    this.state.turnOrder = shuffle(alivePlayerIds.slice());
    this.state.turn = this.state.turnOrder[0]!;
    this.state.players.forEach((player) => {
      player.hasVoted = false;
    });
  }
}

function pickVote(id: string, votes: Record<string, string>) {
  return id in votes ? { [id]: votes[id] as string } : {};
}
