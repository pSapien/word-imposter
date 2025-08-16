import type { LoginRequest, LoginResponse, SyncLoginRequest } from "./auth.js";
import type { CreateRoomRequest, JoinRoomRequest, RoomCreatedResponse, RoomJoinedResponse } from "./room.js";
import type { PingRequest, PongResponse } from "./ping.js";
import type { ErrroResponse } from "./error.js";

export type ClientRequestEvents = LoginRequest | SyncLoginRequest | CreateRoomRequest | JoinRoomRequest | PingRequest;

export type ServerResponseEvents =
  | LoginResponse
  | RoomCreatedResponse
  | RoomJoinedResponse
  | ErrroResponse
  | PongResponse;
