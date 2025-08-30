import type { LoginRequest, LoginResponse } from "./auth.js";
import type {
  CreateRoomRequest,
  JoinRoomRequest,
  KickRoomMemberRequest,
  RoomCreatedResponse,
  RoomJoinedResponse,
  LeaveRoomRequest,
} from "./room.js";
import type {
  GameStateResponse,
  StartGameRequest,
  GameActionRequest,
  GameStateRequest,
  GameStatePatchEvent,
} from "./game.js";
import type { PingRequest, PongResponse } from "./ping.js";
import type { ErrorResponse } from "./error.js";

export type ClientRequestEvents =
  | LoginRequest
  | CreateRoomRequest
  | JoinRoomRequest
  | KickRoomMemberRequest
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
  | GameStatePatchEvent
  | ErrorResponse
  | PongResponse;
