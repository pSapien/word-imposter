export interface GameAction<T extends { playerId: string }> {
  type: string;
  payload: T;
}

export type GameEnginePlayer = {
  id: string;
  displayName: string;
  role: string;
};

export interface GameEngine<S extends {}> {
  startGame(players: GameEnginePlayer[]): boolean;
  processAction(playerId: string, action: GameAction<any>): void;
  validateGameAction(playerId: string, action: GameAction<any>): void;
  getPlayerViewState(playerId: string): S;
}
