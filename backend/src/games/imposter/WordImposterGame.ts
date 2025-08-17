import { GameEngine, GameAction } from "../../core/GameEngine.js";
import { RoomMember, WordImposterState, WordImposterConfig } from "@imposter/shared";
import { getRandomWordPair } from "./wordpairs.js";
import { random, randomArr } from "src/utils/random.js";

interface GamePlayer {
  profileId: string;
  displayName: string;
  role: "host" | "player" | "spectator";
  isEliminated: boolean;
}

export class WordImposterGameEngine implements GameEngine<WordImposterState> {
  readonly gameId: string;
  readonly players: GamePlayer[] = [];
  readonly config: WordImposterConfig;
  private state: WordImposterState;
  public status: "waiting" | "active" | "finished" = "waiting";

  constructor(config: WordImposterConfig) {
    this.config = config;
    this.gameId = `imposter-${Date.now()}`;

    this.state = {
      stage: "setup",
      round: 1,
      imposterIds: [],
      civilianWord: "",
      imposterWord: "",
      votes: {},
    };
  }

  addPlayer(member: RoomMember): boolean {
    if (this.players.length >= this.config.maxPlayers) return false;

    const existingPlayer = this.players.find((p) => p.profileId === member.id);
    if (existingPlayer) return false;

    const player: GamePlayer = {
      profileId: member.id,
      displayName: member.displayName,
      role: member.role,
      isEliminated: false,
    };

    this.players.push(player);
    return true;
  }

  removePlayer(profileId: string): boolean {
    const playerIndex = this.players.findIndex((p) => p.profileId === profileId);
    if (playerIndex === -1) return false;

    this.players.splice(playerIndex, 1);

    // Remove from imposter list if they were one
    const imposterIndex = this.state.imposterIds.indexOf(profileId);
    if (imposterIndex !== -1) {
      this.state.imposterIds.splice(imposterIndex, 1);
    }

    // Remove their vote
    delete this.state.votes[profileId];

    // Check if game should end due to insufficient players
    this.checkGameEndConditions();

    return true;
  }

  startGame(): boolean {
    const activePlayers = this.players.filter((p) => p.role !== "spectator");
    if (activePlayers.length < this.config.minPlayers) return false;

    this.status = "active";
    this.setupRound();
    return true;
  }

  /** Process a player's action in the game */
  processAction(playerId: string, action: GameAction<any>): void {
    const player = this.players.find((p) => p.profileId === playerId);
    if (!player || player.isEliminated) return;

    switch (action.type) {
      case "start_game":
        if (player.role === "host" && this.status === "waiting") {
          this.startGame();
        }
        break;

      case "start_voting":
        if (this.state.stage === "discussion" && this.status === "active") {
          this.state.stage = "voting";
        }
        break;

      case "cast_vote":
        if (this.state.stage === "voting" && action.payload?.suspectId) {
          const targetExists = this.players.some(
            (p) => p.profileId === action.payload.suspectId && !p.isEliminated && p.role !== "spectator"
          );
          if (targetExists && action.payload.suspectId !== playerId) {
            this.state.votes[playerId] = action.payload.suspectId;
          }
        }
        break;

      case "finish_voting":
        if (this.state.stage === "voting" && this.status === "active") {
          this.finishVoting();
        }
        break;

      case "next_round":
        if (this.state.stage === "results" && this.status === "active") {
          this.nextRound();
        }
        break;

      case "restart_game":
        if (player.role === "host" && this.status === "finished") {
          this.restartGame();
        }
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  /** Return a personalized game state for a given member */
  getPersonalizedState(member: RoomMember): WordImposterState & { playerRole?: string } {
    const baseState = { ...this.state, votes: { ...this.state.votes } };
    const player = this.players.find((p) => p.profileId === member.id);

    if (!player || player.role === "spectator") {
      // Spectators see everything during results, limited view during game
      if (this.state.stage === "results" || this.status === "finished") {
        return { ...baseState, playerRole: "spectator" };
      }
      return {
        ...baseState,
        imposterIds: [],
        imposterWord: "",
        playerRole: "spectator",
      };
    }

    const isImposter = this.state.imposterIds.includes(member.id);

    if (isImposter) {
      // Imposters see their word but not the civilian word
      return {
        ...baseState,
        civilianWord: this.state.imposterWord,
        imposterWord: this.state.imposterWord,
        playerRole: "imposter",
      };
    }

    // Civilians only see the civilian word, imposters not revealed
    return {
      ...baseState,
      imposterIds: [],
      imposterWord: "",
      civilianWord: this.state.civilianWord,
      playerRole: "civilian",
    };
  }

  /** Get current game state */
  getGameState(): WordImposterState {
    return { ...this.state };
  }

  /** Start a new round and setup words/imposters */
  private nextRound(): void {
    this.state.round += 1;
    this.state.stage = "discussion";
    this.state.votes = {};
    this.state.roundResults = undefined;
    this.setupRound();
  }

  /** Count votes, eliminate player, determine if game finished */
  private finishVoting(): void {
    this.state.stage = "results";

    const voteCounts: Record<string, number> = {};
    Object.values(this.state.votes).forEach((targetId) => {
      if (!targetId) return;
      voteCounts[targetId] = (voteCounts[targetId] || 0) + 1;
    });

    let eliminatedPlayerId: string | undefined;
    let maxVotes = 0;
    const tiedPlayers: string[] = [];

    // Find player(s) with most votes
    for (const [playerId, votes] of Object.entries(voteCounts)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayerId = playerId;
        tiedPlayers.length = 0;
        tiedPlayers.push(playerId);
      } else if (votes === maxVotes && votes > 0) {
        tiedPlayers.push(playerId);
      }
    }

    // Handle ties - no elimination
    if (tiedPlayers.length > 1) {
      eliminatedPlayerId = undefined;
    }

    const imposterFound = eliminatedPlayerId ? this.state.imposterIds.includes(eliminatedPlayerId) : false;

    // Eliminate the player
    if (eliminatedPlayerId) {
      const player = this.players.find((p) => p.profileId === eliminatedPlayerId);
      if (player) {
        player.isEliminated = true;
      }
    }

    // Check win conditions
    const { gameOver, winner } = this.checkGameEndConditions();

    this.state.roundResults = {
      eliminatedPlayerId,
      imposterFound,
      imposterWord: this.state.imposterWord,
      civilianWord: this.state.civilianWord,
      gameOver,
      winner,
    };

    if (gameOver) {
      this.status = "finished";
      this.state.stage = "finished";
    }
  }

  /** Check if the game should end and determine winner */
  private checkGameEndConditions(): { gameOver: boolean; winner?: "imposters" | "civilians" } {
    const activePlayers = this.players.filter((p) => !p.isEliminated && p.role !== "spectator");
    const activeImposters = activePlayers.filter((p) => this.state.imposterIds.includes(p.profileId));
    const activeCivilians = activePlayers.filter((p) => !this.state.imposterIds.includes(p.profileId));

    // Civilians win if all imposters are eliminated
    if (activeImposters.length === 0) {
      return { gameOver: true, winner: "civilians" };
    }

    // Imposters win if they equal or outnumber civilians
    if (activeImposters.length >= activeCivilians.length) {
      return { gameOver: true, winner: "imposters" };
    }

    // Game continues
    return { gameOver: false };
  }

  /** Randomly assign imposters and words */
  private setupRound(): void {
    const activePlayers = this.players.filter((p) => !p.isEliminated && p.role !== "spectator");

    if (activePlayers.length < this.config.minPlayers) {
      this.status = "finished";
      return;
    }

    const imposterCount = 1;

    /** Select imposters and get a random word pair */
    this.state.imposterIds = randomArr(activePlayers, imposterCount).map((p) => p.profileId);
    const wordPair = getRandomWordPair(random(this.config.settings.wordCategories));

    this.state.civilianWord = wordPair.civilianWord;
    this.state.imposterWord = wordPair.imposterWord;
    this.state.stage = "discussion";
  }

  /** Restart the game */
  private restartGame(): void {
    // Reset all players
    this.players.forEach((player) => {
      player.isEliminated = false;
    });

    // Reset state
    this.state = {
      stage: "setup",
      round: 1,
      imposterIds: [],
      civilianWord: "",
      imposterWord: "",
      votes: {},
    };

    this.status = "waiting";
  }

  /** Get active player count */
  getActivePlayerCount(): number {
    return this.players.filter((p) => !p.isEliminated && p.role !== "spectator").length;
  }

  /** Get imposter count */
  getImposterCount(): number {
    return this.state.imposterIds.filter((id) => {
      const player = this.players.find((p) => p.profileId === id);
      return player && !player.isEliminated;
    }).length;
  }
}
