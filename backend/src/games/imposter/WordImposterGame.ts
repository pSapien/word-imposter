import { GameEngine, GameAction } from "../../core/GameEngine.js";
import { RoomMember, WordImposterState, WordImposterConfig } from "@imposter/shared";
import { getRandomWordPair } from "./wordpairs.js";
import { random, randomArr } from "src/utils/random.js";

interface GamePlayer {
  id: string;
  displayName: string;
  role: "host" | "player" | "spectator";
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
      eliminatedPlayerIds: [],
      civilianWord: "",
      imposterWord: "",
      votes: {},
    };
  }

  addPlayer(member: RoomMember): boolean {
    /**
     * remove previous player if exists
     * this is done just in case if there is profile change or role change
     */
    this.removePlayer(member.id);

    this.players.push({
      id: member.id,
      displayName: member.displayName,
      role: member.role,
    });

    return true;
  }

  removePlayer(profileId: string): boolean {
    const playerIndex = this.players.findIndex((p) => p.id === profileId);
    if (playerIndex === -1) return false;

    this.players.splice(playerIndex, 1);
    return true;
  }

  startGame(members: RoomMember[]): boolean {
    members.forEach((member) => this.addPlayer(member));

    const activePlayers = this.players.filter((p) => p.role !== "spectator");
    if (activePlayers.length < this.config.minPlayers) return false;

    this.status = "active";
    this.setupGame();
    return true;
  }

  validateGameAction(playerId: string, action: GameAction<any>) {
    return true;
  }

  processAction(playerId: string, action: GameAction<any>): void {
    const handlers: Record<string, (id: string, action: GameAction<any>) => void> = {
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
  getPlayerViewState(member: RoomMember): WordImposterState & { playerRole?: string } {
    const playerViewState = {
      ...this.state,
      votes: {
        ...this.state.votes,
      },
    };

    /** spectator gets to see everything */
    if (member.role == "spectator") return playerViewState;

    /** the imposter see `imposterWordz` as their civilianWord */
    if (playerViewState.imposterIds.includes(member.id)) {
      playerViewState.civilianWord = this.state.imposterWord;
    }

    /** all the player except spectator don't get to see `imposterWord` or `imposterIds` */
    playerViewState.imposterWord = "";
    playerViewState.imposterIds = [];

    return playerViewState;
  }

  private handleStartVote(playerId: string, action: GameAction<any>) {
    this.state.stage = "voting";
  }

  private handleCastVote(playerId: string, action: GameAction<any>) {
    /** no voteeId means the player skipped the vote */
    this.state.votes[playerId] = action.payload?.voteeId || "";
  }

  private handleEndVoting(playerId: string, action: GameAction<any>) {
    this.state.stage = "results";

    const eliminatedPlayers = getEliminatedPlayerByVotes(this.state.votes);
    const eliminatedPlayerId = eliminatedPlayers.length === 1 ? eliminatedPlayers[0] : null;
    const imposterFound = this.state.imposterIds.includes(eliminatedPlayerId);

    if (eliminatedPlayerId) this.state.eliminatedPlayerIds.push(eliminatedPlayerId);

    const winner = this.findWinner();

    this.state.roundResults = {
      eliminatedPlayerId,
      imposterFound,
      imposterWord: this.state.imposterWord,
      winner,
    };

    if (winner) this.status = "finished";
  }

  /** Check if the game should end and determine winner */
  private findWinner(): "imposters" | "civilians" | null {
    const activePlayers = this.players.filter(
      (p) => p.role !== "spectator" && !this.state.eliminatedPlayerIds.includes(p.id)
    );

    const activeImposters = activePlayers.filter((p) => this.state.imposterIds.includes(p.id));
    const activeCivilians = activePlayers.filter((p) => !this.state.imposterIds.includes(p.id));

    // If no imposters remain, civilians win
    if (activeImposters.length === 0) {
      return "civilians";
    }

    // If imposters are equal to or outnumber civilians, imposters win
    if (activeImposters.length >= activeCivilians.length) {
      return "imposters";
    }

    // Otherwise, no winner yet
    return null;
  }

  private handleStartNextRound() {
    this.state.stage = "discussion";
    this.state.roundResults = undefined;
    this.state.round += 1;
    this.state.votes = {};
  }

  /** Randomly assign imposters and words */
  private setupGame(): void {
    const activePlayers = this.players.filter((p) => p.id && p.role !== "spectator");
    const imposterCount = 1;

    /** Select imposters and get a random word pair */
    this.state.imposterIds = randomArr(activePlayers, imposterCount).map((p) => p.id);
    console.log("WordCategories are:", this.config.settings);
    const wordPair = getRandomWordPair(random(this.config.settings.wordCategories));

    this.state.civilianWord = wordPair.civilianWord;
    this.state.imposterWord = wordPair.imposterWord;
    this.state.stage = "discussion";
  }
}

function getEliminatedPlayerByVotes(votes: Record<string, string>): string[] {
  const voteCounts: Record<string, number> = {};
  let skips = 0;

  Object.values(votes).forEach((votee) => {
    if (votee) {
      voteCounts[votee] = (voteCounts[votee] || 0) + 1;
    } else {
      skips++;
    }
  });

  if (Object.keys(voteCounts).length === 0) return [];

  const maxVotes = Math.max(...Object.values(voteCounts));

  if (skips >= maxVotes) return [];
  if (maxVotes === 0) return [];

  return Object.entries(voteCounts)
    .filter(([_, count]) => count === maxVotes)
    .map(([player]) => player);
}
