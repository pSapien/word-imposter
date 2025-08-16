export interface CreateRoomRequest {
  type: "create_room";
  payload: {
    gameName: string;
    roomName: string;
  };
}

export interface JoinRoomRequest {
  type: "join_room";
  payload: {
    roomCode: string;
    role?: "player" | "spectator";
  };
}

export interface RoomJoinedResponse {
  type: "room_joined";
  payload: {
    roomCode: string;
    roomName: string;
    hostId: string;
  };
}

export interface RoomCreatedResponse {
  type: "room_created";
  payload: {
    roomCode: string;
    roomName: string;
    hostId: string;
  };
}

export interface RoomJoinedResponse {
  type: "room_joined";
  payload: {
    roomCode: string;
    roomName: string;
    hostId: string;
  };
}
