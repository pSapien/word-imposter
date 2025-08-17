import type { LoginRequest, LoginResponse, SyncLoginRequest } from "./auth.js";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  RoomCreatedResponse,
  RoomJoinedResponse,
  LeaveRoomRequest,
} from "./room.js";
import type { GameStateResponse, StartGameRequest, GameActionRequest, GameStateRequest } from "./game.js";
import type { PingRequest, PongResponse } from "./ping.js";
import type { ErrorResponse } from "./error.js";

export type ClientRequestEvents =
  | LoginRequest
  | SyncLoginRequest
  | CreateRoomRequest
  | JoinRoomRequest
  | LeaveRoomRequest
  | StartGameRequest
  | GameActionRequest<any>
  | GameStateRequest<any>
  | PingRequest;

export type ServerResponseEvents =
  | LoginResponse
  | RoomCreatedResponse
  | RoomJoinedResponse
  | GameStateResponse<any>
  | ErrorResponse
  | PongResponse;
