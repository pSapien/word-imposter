import { v4 as uuidv4 } from "uuid";

export class IdGenerator {
  static generatePlayerId(): string {
    return `player_${uuidv4()}`;
  }

  static generateRoomId(): string {
    return `room_${uuidv4()}`;
  }

  static generateGameId(): string {
    return `game_${uuidv4()}`;
  }

  static generateSessionToken(): string {
    return `session_${uuidv4()}`;
  }
}
