import { SharedConstants } from "./constants";

export class Validators {
  static validatePlayerName(playerName: string): void {
    const trimmed = playerName.trim();

    if (!trimmed) throw new Error("⚠️ Player name is required");

    if (trimmed.length < SharedConstants.PLAYER_NAME_MIN_CHAR_LENGTH) {
      throw new Error(`⚠️ Player name must be at least ${SharedConstants.PLAYER_NAME_MIN_CHAR_LENGTH} characters`);
    }

    if (trimmed.length > SharedConstants.PLAYER_NAME_MAX_CHAR_LENGTH) {
      throw new Error(`❌ Player name must be ${SharedConstants.PLAYER_NAME_MAX_CHAR_LENGTH} characters or less`);
    }
  }

  static validateRoomName(roomName: string): void {
    const trimmed = roomName.trim();

    if (!trimmed) throw new Error("⚠️ Room name is required");

    if (trimmed.length < SharedConstants.ROOM_NAME_MIN_CHAR_LENGTH)
      throw new Error(`⚠️ Room name must be at least ${SharedConstants.ROOM_NAME_MIN_CHAR_LENGTH} characters`);

    if (trimmed.length > SharedConstants.ROOM_NAME_MAX_CHAR_LENGTH)
      throw new Error(`❌ Room name must be ${SharedConstants.ROOM_NAME_MAX_CHAR_LENGTH} characters or less`);
  }
}
