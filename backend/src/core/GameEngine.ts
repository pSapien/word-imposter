import { RoomMember } from "@imposter/shared";

export interface GameAction<T extends { playerId: string }> {
  type: string;
  payload: T;
}

export interface GameEngine<S extends {}> {
  startGame(member: RoomMember[]): boolean;
  processAction(playerId: string, action: GameAction<any>): void;
  validateGameAction(playerId: string, action: GameAction<any>): void;
  getPlayerViewState(member: RoomMember): S;
}
