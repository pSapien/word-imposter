import type { GameEngine, GameAction, GameEnginePlayer } from "@server/core";
import type {
  WordImposterState,
  WordImposterConfig,
  WordImposterImpostersWinSummary,
  WordImposterCiviliansWinSummary,
} from "@imposter/shared";
import { getRandomWordPair } from "./wordpairs.js";
import { computeWinner, getEliminatedPlayerByVotes, randomImposters } from "./logic/index.js";

export class WordImposterGameEngine implements GameEngine<WordImposterState> {
  readonly gameId: string;
  readonly config: WordImposterConfig;
  private state: WordImposterState;

  constructor(config: WordImposterConfig) {
    this.config = config;
    this.gameId = `imposter-${Date.now()}`;

    this.state = {
      stage: "waiting",
      round: 0,
      imposterIds: [],
      civilianWord: "",
      imposterWord: "",
      players: [],
      votes: {},
      playerWordSubmissions: {},
      summary: undefined,
    };
  }

  startGame(players: GameEnginePlayer[]): boolean {
    const wordPair = getRandomWordPair(this.config.wordCategories);

    this.state.stage = "discussion";
    this.state.round = 1;
    this.state.players = players.map((player) => {
      return {
        displayName: player.displayName,
        id: player.id,
        role: player.role,
        status: "alive",
        hasVoted: false,
        hasSubmittedWord: false,
      };
    });
    this.state.imposterIds = randomImposters(
      this.state.players.map((p) => p.id),
      this.config.imposterCount
    );
    this.state.civilianWord = wordPair.civilianWord;
    this.state.imposterWord = wordPair.imposterWord;

    return true;
  }

  validateGameAction(playerId: string, action: GameAction<any>) {
    const player = this.state.players.find((player) => player.id === playerId);
    if (!player) throw new Error("Player not found");

    if (action.type === "submit_word") {
      if (this.state.stage !== "discussion") throw new Error("Not the time to submit words.");
      if (player.role === "spectator") throw new Error("Spectator are not allowed to submit");
      if (player.status === "eliminated") throw new Error("Not allowed to submit");
    }

    if (action.type === "start_voting") {
      if (this.state.stage !== "discussion") throw new Error("This is not the stage to start voting");
      if (player.role !== "host") throw new Error("Only host can start voting");
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

    return true;
  }

  processAction(playerId: string, action: GameAction<any>): void {
    const handlers: Record<string, (id: string, action: GameAction<any>) => void> = {
      submit_word: this.handleSubmitWord.bind(this),
      start_voting: this.handleStartVote.bind(this),
      cast_vote: this.handleCastVote.bind(this),
      end_voting: this.handleEndVoting.bind(this),
      start_next_round: this.handleStartNextRound.bind(this),
    };

    const handler = handlers[action.type];
    if (handler) handler(playerId, action);
    else console.warn("Unknow Action", action.type);
  }

  /** Return a personalized game state for a given member */
  getPlayerViewState(profileId: string): WordImposterState {
    const player = this.state.players.find((p) => p.id === profileId);
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

    return clientState;
  }

  private handleSubmitWord(playerId: string, action: GameAction<any>) {
    const player = this.state.players.find((player) => player.id === playerId);
    if (!player) throw new Error("Player Not Found");

    this.state.playerWordSubmissions[playerId] = action.payload.word;
    player.hasSubmittedWord = true;
  }

  private handleStartVote(playerId: string, action: GameAction<any>) {
    this.state.stage = "voting";
  }

  private handleCastVote(playerId: string, action: GameAction<any>) {
    /** no voteeId means the player skipped the vote */
    const player = this.state.players.find((player) => player.id === playerId);
    if (!player) throw new Error("Player Not Found");

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
    this.state.stage = "discussion";
    this.state.summary = undefined;
    this.state.round += 1;
    this.state.votes = {};
    this.state.players.forEach((player) => {
      player.hasVoted = false;
      player.hasSubmittedWord = false;
    });
    this.state.playerWordSubmissions = {};
  }
}

function pickVote(id: string, votes: Record<string, string>) {
  return id in votes ? { [id]: votes[id] as string } : {};
}

function pickWord(id: string, submission: Record<string, string>) {
  return id in submission ? { [id]: submission[id] as string } : {};
}
