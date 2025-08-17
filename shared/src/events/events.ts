import type { LoginRequest, LoginResponse, SyncLoginRequest } from "./auth.js";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomCreatedResponse,
  RoomJoinedResponse,
  LeaveRoomRequest,
} from "./room.js";
import type { StartGameRequest } from "./game.js";
import type { PingRequest, PongResponse } from "./ping.js";
import type { ErrorResponse } from "./error.js";

export type ClientRequestEvents =
  | LoginRequest
  | SyncLoginRequest
  | CreateRoomRequest
  | JoinRoomRequest
  | LeaveRoomRequest
  | StartGameRequest
  | PingRequest;

export type ServerResponseEvents =
  | LoginResponse
  | RoomCreatedResponse
  | RoomJoinedResponse
  | ErrorResponse
  | PongResponse;
