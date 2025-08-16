import { BaseGame, GameAction, GameResult, GameConfig } from "../../core/GameEngine.js";
import { getRandomWordPair } from "./wordpairs.js";

interface WordImposterState {
  imposterIds: string[];
  civilianWord: string;
  imposterWord: string;
  wordCategories: string[];
  stage: "discussion" | "voting" | "results";
  votes: Record<string, string>;
  roundResults?: {
    eliminatedPlayerId?: string;
    imposterFound: boolean;
    imposterWord: string;
  };
}

interface WordImposterConfig extends GameConfig {
  settings: {
    imposterCount: number;
    wordCategories: string[];
    discussionTimeMs?: number;
    votingTimeMs?: number;
  };
}

export class WordImposterGame extends BaseGame {
  private gameState: WordImposterState;
  private config: WordImposterConfig;

  constructor(config: WordImposterConfig) {
    super("word-imposter", config);
    this.config = config;
    this.gameState = {
      imposterIds: [],
      civilianWord: "",
      imposterWord: "",
      wordCategories: config.settings.wordCategories,
      stage: "discussion",
      votes: {},
    };
    this.state.data = this.gameState;
  }

  canStart(): boolean {
    return this.state.players.length >= this.config.minPlayers && this.state.players.length <= this.config.maxPlayers;
  }

  start(): GameResult {
    const result = super.start();
    if (!result.success) {
      return result;
    }

    // Setup game-specific state
    this.setupRound();

    return {
      ...result,
      events: [...(result.events || []), { type: "round_started", data: { stage: this.gameState.stage } }],
    };
  }

  validateAction(action: GameAction): boolean {
    const player = this.state.players.find((p) => p.profileId === action.playerId);
    if (!player || player.isEliminated) {
      return false;
    }

    switch (action.type) {
      case "start_voting":
        return this.gameState.stage === "discussion";
      case "cast_vote":
        return (
          this.gameState.stage === "voting" &&
          action.data?.targetId &&
          this.state.players.some((p) => p.profileId === action.data.targetId)
        );
      case "finish_voting":
        return this.gameState.stage === "voting";
      case "next_round":
        return this.gameState.stage === "results";
      default:
        return false;
    }
  }

  processAction(action: GameAction): GameResult {
    if (!this.validateAction(action)) {
      return { success: false, error: "Invalid action" };
    }

    switch (action.type) {
      case "start_voting":
        return this.startVoting();
      case "cast_vote":
        return this.castVote(action.playerId, action.data.targetId);
      case "finish_voting":
        return this.finishVoting();
      case "next_round":
        return this.nextRound();
      default:
        return { success: false, error: "Unknown action" };
    }
  }

  getPlayerView(playerId: string): any {
    const player = this.state.players.find((p) => p.profileId === playerId);
    if (!player) {
      return null;
    }

    const isImposter = this.gameState.imposterIds.includes(playerId);
    const baseView = {
      gameId: this.state.gameId,
      status: this.state.status,
      stage: this.gameState.stage,
      players: this.state.players.map((p) => ({
        profileId: p.profileId,
        displayName: p.displayName,
        isEliminated: p.isEliminated || false,
      })),
      votes: this.gameState.stage === "results" ? this.gameState.votes : {},
      roundResults: this.gameState.roundResults,
    };

    if (player.role === "spectator") {
      // Spectators see everything
      return {
        ...baseView,
        word: this.gameState.civilianWord,
        imposterWord: this.gameState.imposterWord,
        imposterIds: this.gameState.imposterIds,
      };
    }

    // Players see their assigned word
    return {
      ...baseView,
      word: isImposter ? this.gameState.imposterWord : this.gameState.civilianWord,
      isImposter,
    };
  }

  private setupRound(): void {
    // Select imposters
    const activePlayers = this.state.players.filter((p) => !p.isEliminated && p.role !== "spectator");
    const imposterCount = Math.min(this.config.settings.imposterCount, Math.floor(activePlayers.length / 2));

    const shuffled = [...activePlayers].sort(() => Math.random() - 0.5);
    this.gameState.imposterIds = shuffled.slice(0, imposterCount).map((p) => p.profileId);

    // Get word pair
    const category = this.gameState.wordCategories[Math.floor(Math.random() * this.gameState.wordCategories.length)];
    const { civilianWord, imposterWord } = getRandomWordPair(category);

    this.gameState.civilianWord = civilianWord;
    this.gameState.imposterWord = imposterWord;
    this.gameState.stage = "discussion";
    this.gameState.votes = {};
    this.gameState.roundResults = undefined;
  }

  private startVoting(): GameResult {
    this.gameState.stage = "voting";
    return {
      success: true,
      newState: { data: this.gameState },
      events: [{ type: "voting_started", data: {} }],
    };
  }

  private castVote(voterId: string, targetId: string): GameResult {
    this.gameState.votes[voterId] = targetId;
    return {
      success: true,
      newState: { data: this.gameState },
      events: [
        {
          type: "vote_cast",
          data: { voterId, hasVoted: true },
          targetPlayers: [voterId], // Only notify the voter
        },
      ],
    };
  }

  private finishVoting(): GameResult {
    this.gameState.stage = "results";

    // Count votes
    const voteCounts: Record<string, number> = {};
    Object.values(this.gameState.votes).forEach((targetId) => {
      if (targetId) {
        voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
      }
    });

    // Find most voted player
    let eliminatedPlayerId: string | undefined;
    let maxVotes = 0;
    let tiedPlayers: string[] = [];

    Object.entries(voteCounts).forEach(([playerId, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayerId = playerId;
        tiedPlayers = [playerId];
      } else if (votes === maxVotes) {
        tiedPlayers.push(playerId);
      }
    });

    // Handle ties
    if (tiedPlayers.length > 1) {
      eliminatedPlayerId = undefined;
    }

    // Check if imposter was found
    const imposterFound = eliminatedPlayerId ? this.gameState.imposterIds.includes(eliminatedPlayerId) : false;

    // Eliminate player if not tied
    if (eliminatedPlayerId) {
      const player = this.state.players.find((p) => p.profileId === eliminatedPlayerId);
      if (player) {
        player.isEliminated = true;
      }
    }

    this.gameState.roundResults = {
      eliminatedPlayerId,
      imposterFound,
      imposterWord: this.gameState.imposterWord,
    };

    // Check win conditions
    const activePlayers = this.state.players.filter((p) => !p.isEliminated && p.role !== "spectator");
    const activeImposters = activePlayers.filter((p) => this.gameState.imposterIds.includes(p.profileId));

    let gameFinished = false;
    if (imposterFound || activeImposters.length === 0) {
      // Civilians win
      gameFinished = true;
    } else if (activeImposters.length >= activePlayers.length - activeImposters.length) {
      // Imposters win
      gameFinished = true;
    }

    const events = [{ type: "voting_finished", data: this.gameState.roundResults }];

    if (gameFinished) {
      this.finish();
      events.push({ type: "game_finished", data: this.gameState.roundResults });
    }

    return {
      success: true,
      newState: {
        data: this.gameState,
        players: [...this.state.players],
        status: this.state.status,
      },
      events,
    };
  }

  private nextRound(): GameResult {
    this.state.currentRound++;
    this.setupRound();

    return {
      success: true,
      newState: {
        currentRound: this.state.currentRound,
        data: this.gameState,
      },
      events: [{ type: "round_started", data: { stage: this.gameState.stage } }],
    };
  }
}
