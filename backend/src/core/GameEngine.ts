import { RoomMember } from "@imposter/shared";

export interface GameAction<T extends { playerId: string }> {
  type: string;
  payload: T;
}

export interface GameEngine<S extends {}> {
  processAction(playerId: string, action: GameAction<any>): void;
  getPersonalizedState(member: RoomMember): S;
}
