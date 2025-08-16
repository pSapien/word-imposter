import { uuid } from "uuidv4";

export interface GamePlayer {
  profileId: string;
  displayName: string;
  role?: string;
  isEliminated?: boolean;
}

export interface GameState {
  gameId: string;
  gameType: string;
  status: "waiting" | "active" | "paused" | "finished";
  players: GamePlayer[];
  currentRound: number;
  startedAt?: number;
  finishedAt?: number;
  data: Record<string, any>; // Game-specific data
}

export interface GameConfig {
  minPlayers: number;
  maxPlayers: number;
  allowSpectators: boolean;
  settings: Record<string, any>;
}

export interface GameAction {
  type: string;
  playerId: string;
  data?: any;
}

export interface GameResult {
  success: boolean;
  newState?: Partial<GameState>;
  events?: GameEvent[];
  error?: string;
}

export interface GameEvent {
  type: string;
  data: any;
  targetPlayers?: string[]; // If undefined, broadcast to all
}

export abstract class BaseGame {
  protected state: GameState;
  protected config: GameConfig;

  constructor(gameType: string, config: GameConfig) {
    this.state = {
      gameId: uuid(),
      gameType,
      status: "waiting",
      players: [],
      currentRound: 0,
      data: {},
    };
    this.config = config;
  }

  abstract validateAction(action: GameAction): boolean;
  abstract processAction(action: GameAction): GameResult;
  abstract getPlayerView(playerId: string): any;
  abstract canStart(): boolean;

  getState(): GameState {
    return { ...this.state };
  }

  addPlayer(player: GamePlayer): GameResult {
    if (this.state.players.length >= this.config.maxPlayers) {
      return { success: false, error: "Game is full" };
    }

    if (this.state.players.some((p) => p.profileId === player.profileId)) {
      return { success: false, error: "Player already in game" };
    }

    this.state.players.push(player);
    return {
      success: true,
      newState: { players: [...this.state.players] },
      events: [{ type: "player_joined", data: { player } }],
    };
  }

  removePlayer(profileId: string): GameResult {
    const playerIndex = this.state.players.findIndex((p) => p.profileId === profileId);
    if (playerIndex === -1) {
      return { success: false, error: "Player not found" };
    }

    const removedPlayer = this.state.players[playerIndex];
    this.state.players.splice(playerIndex, 1);

    return {
      success: true,
      newState: { players: [...this.state.players] },
      events: [{ type: "player_left", data: { player: removedPlayer } }],
    };
  }

  start(): GameResult {
    if (!this.canStart()) {
      return { success: false, error: "Cannot start game" };
    }

    this.state.status = "active";
    this.state.startedAt = Date.now();
    this.state.currentRound = 1;

    return {
      success: true,
      newState: {
        status: this.state.status,
        startedAt: this.state.startedAt,
        currentRound: this.state.currentRound,
      },
      events: [{ type: "game_started", data: {} }],
    };
  }

  finish(): GameResult {
    this.state.status = "finished";
    this.state.finishedAt = Date.now();

    return {
      success: true,
      newState: {
        status: this.state.status,
        finishedAt: this.state.finishedAt,
      },
      events: [{ type: "game_finished", data: {} }],
    };
  }
}
