// Base game interfaces that all games must implement

export interface BaseGameState {
  gameId: string;
  gameType: string;
  status: "waiting" | "active" | "paused" | "finished";
  players: GamePlayer[];
  currentRound: number;
  startedAt?: number;
  finishedAt?: number;
}

export interface GamePlayer {
  profileId: string;
  displayName: string;
  role?: string;
  isEliminated?: boolean;
  isHost?: boolean;
  isCurrentUser?: boolean;
}

export interface GameAction {
  type: string;
  data?: any;
}

export interface GameEvent {
  type: string;
  data: any;
}

export interface GameSettings {
  [key: string]: any;
}

export interface GameConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  defaultSettings: GameSettings;
  categories?: string[];
}

// Game component interfaces
export interface GameComponentProps {
  gameState: any;
  currentUserId: string;
  isHost: boolean;
  onGameAction: (action: GameAction) => void;
}

export interface GameSettingsProps {
  config: GameConfig;
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  playerCount: number;
  isHost: boolean;
}

export interface GameUIProps extends GameComponentProps {
  roomCode: string;
  onLeaveRoom: () => void;
}
